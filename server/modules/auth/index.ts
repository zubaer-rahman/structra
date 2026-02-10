import { z } from 'zod'
import { USER_ROLE_VALUES, USER_ROLES } from '@/utils/constants'
import { router, publicProcedure, protectedProcedure } from '~/server/trpc'
import { TRPCError } from '@trpc/server'
import { createClient } from '@supabase/supabase-js'
import { generateContractorSlug, generateUniqueSlug } from '@/utils/helpers/slugUtils'

export const authRouter = router({
  // Sign up procedure
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        first_name: z.string().min(1),
        last_name: z.string().min(1),
        user_role: z.enum(USER_ROLE_VALUES),
        user_agreed_to_terms: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      // Create Supabase client without cookies for authentication
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: `${input.first_name} ${input.last_name}`,
            first_name: input.first_name,
            last_name: input.last_name,
            user_role: input.user_role,
            user_agreed_to_terms: input.user_agreed_to_terms,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (error) {
        // Provide more specific error messages for common sign-up failures
        let errorMessage = error.message
        
        if (error.message === 'User already registered') {
          errorMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.'
        } else if (error.message.includes('Unable to validate email address')) {
          errorMessage = 'Unable to validate email address. Please check your email and try again.'
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: errorMessage,
        })
      }

      if (data.user) {
        try {
          // Use service role client for database operations to bypass RLS during registration
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          // Insert user data into the users table with essential fields only
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: data.user.id,
              email: input.email,
              user_role: input.user_role,
              full_name: `${input.first_name} ${input.last_name}`,
              first_name: input.first_name,
              last_name: input.last_name,
              user_agreed_to_terms: input.user_agreed_to_terms,
            })

          if (insertError) {
            console.error('Failed to insert user into database:', insertError)
            console.error('Error details:', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            })
            // Don't throw error here as the user was created in Supabase Auth
            // The user can still sign in, but some profile data might be missing
          }

          // If user is a contractor, create a contractor profile
          if (input.user_role === USER_ROLES.CONTRACTOR && data.user.id) {
            // Generate unique slug for the contractor profile
            const baseSlug = generateContractorSlug(
              `${input.first_name} ${input.last_name}`
            );
            
            // Get existing slugs to ensure uniqueness
            const { data: existingProfiles } = await supabaseAdmin
              .from('contractor_profiles')
              .select('slug')
              .not('slug', 'is', null);
            
            const existingSlugs = existingProfiles?.map(p => p.slug) || [];
            const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

            const { error: profileError } = await supabaseAdmin
              .from('contractor_profiles')
              .insert({
                user_id: data.user.id,
                business_name: `${input.first_name} ${input.last_name}`,
                is_insurance_verified: false,
                slug: uniqueSlug,
              })

            if (profileError) {
              console.error('Failed to create contractor profile:', profileError)
              // Don't throw error here as the user was created successfully
            } else {
              // Update the user's contractor_profile field with the new profile ID
              const { data: profileData } = await supabaseAdmin
                .from('contractor_profiles')
                .select('id')
                .eq('user_id', data.user.id)
                .single()

              if (profileData?.id) {
                await supabaseAdmin
                  .from('users')
                  .update({ contractor_profile: profileData.id })
                  .eq('id', data.user.id)
              }
            }
          }
        } catch (dbError) {
          console.error('Database operation failed:', dbError)
          // Don't throw error here as the user was created in Supabase Auth
          // The user can still sign in, but some profile data might be missing
        }
      }

      return {
        user: data.user,
        message: 'Check your email for the confirmation link!',
      }
    }),

  // Sign in procedure
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Create Supabase client without cookies for authentication
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      })

      if (error) {
        // Provide more specific error messages for common auth failures
        let errorMessage = error.message
        
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message === 'Email not confirmed') {
          errorMessage = 'Your account is not yet confirmed. Please check your email and click the confirmation link before signing in.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many failed attempts. Please wait a moment before trying again.'
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email address. Please check your email or create a new account.'
        }

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: errorMessage,
        })
      }

      return {
        user: data.user,
        session: data.session,
      }
    }),

  // Sign out procedure
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return { success: true }
  }),

  // Create admin user procedure (admin only)
  createAdmin: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        first_name: z.string().min(1),
        last_name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if the current user is an admin
      const { data: currentUser, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError || !currentUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        })
      }

      if (currentUser.user_role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create admin accounts',
        })
      }

      // Create Supabase client for admin operations
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // You'll need to add this to your env
      )

      // Create the admin user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true, // Auto-confirm admin emails
        user_metadata: {
          first_name: input.first_name,
          last_name: input.last_name,
          user_role: 'admin',
        },
      })

      if (authError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create admin user: ${authError.message}`,
        })
      }

      if (authData.user) {
        // Insert admin user into users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: input.email,
            user_role: 'admin',
            first_name: input.first_name,
            last_name: input.last_name,
            is_active: true,
            is_verified_email: true,
            user_agreed_to_terms: true,
          })

        if (insertError) {
          // If user creation in database fails, try to clean up the auth user
          await supabase.auth.admin.deleteUser(authData.user.id)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create admin profile',
          })
        }

        return {
          success: true,
          message: 'Admin user created successfully',
          userId: authData.user.id,
        }
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create admin user',
      })
    }),

  // Reset password procedure
  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Create Supabase client without cookies for authentication
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
      })

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return {
        message: 'Check your email for the password reset link!',
      }
    }),

  // Update password procedure
  updatePassword: protectedProcedure
    .input(
      z.object({
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { error } = await ctx.supabase.auth.updateUser({
        password: input.password,
      })

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return { success: true }
    }),

  // Get current user procedure
  getUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user
  }),

  // Get current session procedure
  getSession: publicProcedure.query(async () => {
    // Create Supabase client without cookies for session check
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return session
  }),

  // Check if email exists procedure
  checkEmailExists: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ input }) => {
      // Create Supabase client without cookies for email check
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      try {
        // Check if email exists in users table
        const { data, error } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', input.email.toLowerCase().trim())
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to check email availability',
          })
        }

        return {
          exists: !!data,
          email: input.email,
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        
        console.error('Error checking email existence:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check email availability',
        })
      }
    }),
})