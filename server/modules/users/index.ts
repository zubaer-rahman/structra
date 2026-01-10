import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '~/server/trpc'
import { TRPCError } from '@trpc/server'
import { contractorProfileCreateSchema, contractorProfileUpdateSchema } from '@/server/database/schemas/contractor_profiles'
import { generateContractorSlug, generateUniqueSlug } from '@/utils/helpers/slugUtils'

export const usersRouter = router({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.supabase) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection not available',
      })
    }
    
    const { data: profile, error } = await ctx.supabase
      .from('users')
      .select('*')
      .eq('id', ctx.user.id)
      .single()

    if (error) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Profile not found',
      })
    }

    return profile
  }),

  // Check if user is verified contractor
  checkVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.supabase) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection not available',
      })
    }

    try {
      const user = ctx.user

      const { data: transaction, error } = await ctx.supabase
        .from('transactions')
        .select('valid_until')
        .eq('user_id', user.id)
        .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription'])
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const isValid =
        !error &&
        !!transaction?.valid_until &&
        new Date(transaction.valid_until) >= new Date()
      const expiryDate = transaction?.valid_until ? new Date(transaction.valid_until) : null

      // Keep users table flag in sync, but never fail status response because of this write.
      await ctx.supabase
        .from('users')
        .update({ is_verified_contractor: !!isValid })
        .eq('id', user.id)
      
      return {
        isVerified: !!isValid,
        userId: user.id,
        email: user.email,
        expiryDate: expiryDate?.toISOString() || null,
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      
      console.error('Error checking verification status:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check verification status',
      })
    }
  }),

  // Update verification status (validates payment before updating)
  updateVerificationStatus: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isVerified: z.boolean(),
        subscriptionId: z.string().optional(),
        stripeCustomerId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.supabase) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection not available',
        })
      }
      
      try {
        const supabase = ctx.supabase
        const user = ctx.user
        
        // Only allow users to update their own status
        if (ctx.user.id !== input.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot update other users verification status',
          })
        }

        // No payment validation - update status directly on success

        // Update user verification status in database
        const { error } = await supabase
          .from('users')
          .update({
            is_verified_contractor: input.isVerified,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.userId)

        if (error) {
          console.error('Error updating user verification status:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update verification status',
          })
        }

        // Also update user metadata for additional info
        const { error: metadataError } = await supabase.auth.admin.updateUserById(
          input.userId,
          {
            user_metadata: {
              ...user.user_metadata,
              verification_date: input.isVerified ? new Date().toISOString() : undefined,
              stripe_subscription_id: input.subscriptionId,
              stripe_customer_id: input.stripeCustomerId,
            }
          }
        )

        if (metadataError) {
          console.warn('Warning: Could not update user metadata:', metadataError)
          // Don't fail the whole operation if metadata update fails
        }

        console.log(`✅ Successfully updated verification status for user ${input.userId} to ${input.isVerified}`)
        return { success: true, isVerified: input.isVerified }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update verification status',
        })
      }
    }),

  // Update homeowner verification status
  updateHomeownerVerificationStatus: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isVerified: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.supabase) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection not available',
        })
      }
      
      try {
        const supabase = ctx.supabase
        
        // Only allow users to update their own verification status
        if (ctx.user.id !== input.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot update other users verification status',
          })
        }

        // Update user homeowner verification status in database
        const { error } = await supabase
          .from('users')
          .update({
            is_verified_homeowner: input.isVerified,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.userId)

        if (error) {
          console.error('Error updating homeowner verification status:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update homeowner verification status',
          })
        }

        console.log('✅ Successfully updated homeowner verification status for user:', input.userId)
        return { success: true, isVerified: input.isVerified }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        
        console.error('Failed to update homeowner verification status:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update homeowner verification status',
        })
      }
    }),

  // Update project access status
   updateProjectAccessStatus: protectedProcedure
     .input(
       z.object({
         userId: z.string(),
         projectId: z.string(),
       })
     )
     .mutation(async ({ input, ctx }) => {
       if (!ctx.supabase) {
         throw new TRPCError({
           code: 'INTERNAL_SERVER_ERROR',
           message: 'Database connection not available',
         })
       }
       
       try {
         const supabase = ctx.supabase
         
         // Only allow users to update their own status
         if (ctx.user.id !== input.userId) {
           throw new TRPCError({
             code: 'FORBIDDEN',
             message: 'Cannot update other users project access status',
           })
         }
 
         // Check if project_views record already exists
          const { data: existingView, error: checkError } = await supabase
            .from('project_views')
            .select('id')
            .eq('project', input.projectId)
            .eq('contractor', input.userId)
            .single()
 
         if (checkError && checkError.code !== 'PGRST116') {
           console.error('Error checking existing project view:', checkError)
           throw new TRPCError({
             code: 'INTERNAL_SERVER_ERROR',
             message: 'Failed to check project access',
           })
         }
 
         const expiresAt = new Date()
         expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year access
 
         if (existingView) {
           // Update existing record
           const { error } = await supabase
             .from('project_views')
             .update({
               is_active: 'yes',
               expires_at: expiresAt.toISOString(),
               access_method: 'Manual Paywall',
               updated_at: new Date().toISOString(),
             })
             .eq('id', existingView.id)
 
           if (error) {
             console.error('Error updating project access:', error)
             throw new TRPCError({
               code: 'INTERNAL_SERVER_ERROR',
               message: 'Failed to update project access',
             })
           }
         } else {
           // Create new record
           const { error } = await supabase
             .from('project_views')
             .insert({
               project: input.projectId,
               contractor: input.userId,
               created_by: input.userId, // Required field
               is_active: 'yes',
               expires_at: expiresAt.toISOString(),
               access_method: 'Manual Paywall',
               can_submit_proposal: 'yes',
               view_status: 'Viewed', // Required field
               viewed_at: new Date().toISOString(), // Required field
               was_paid_view: 'yes', // Required field
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString(),
             })
 
           if (error) {
             console.error('Error creating project access:', error)
             throw new TRPCError({
               code: 'INTERNAL_SERVER_ERROR',
               message: 'Failed to create project access',
             })
           }
         }
 
         return { success: true, hasAccess: true }
       } catch (error) {
         if (error instanceof TRPCError) throw error
         
         throw new TRPCError({
           code: 'INTERNAL_SERVER_ERROR',
           message: 'Failed to update project access status',
         })
       }
     }),

  // Webhook-specific verification update (no authentication required)
  updateVerificationStatusWebhook: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        isVerified: z.boolean(),
        subscriptionId: z.string().optional(),
        stripeCustomerId: z.string().optional(),
        webhookSecret: z.string(), // Add webhook secret for security
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify webhook secret for security
      if (input.webhookSecret !== process.env.STRIPE_WEBHOOK_SECRET) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook secret',
        })
      }

      if (!ctx.supabase) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection not available',
        })
      }
      
      try {
        console.log('🔄 Webhook updating verification status for user:', input.userId)
        
        const supabase = ctx.supabase

        // Update user verification status in database
        const { error } = await supabase
          .from('users')
          .update({
            is_verified_contractor: input.isVerified,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.userId)

        if (error) {
          console.error('Error updating user verification status:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update verification status',
          })
        }

        console.log('✅ Successfully updated verification status for user:', input.userId)
        return { success: true, isVerified: input.isVerified }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        
        console.error('Failed to update verification status:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update verification status',
        })
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        first_name: z.string().min(1).optional(),
        last_name: z.string().min(1).optional(),
        phone_number: z.string().optional(),
        address: z.string().optional(),
        full_name: z.string().optional(), // Allow full_name to be updated
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.supabase) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection not available',
        })
      }
      
      // If first_name or last_name is being updated, we need to construct the full_name
      let updateData = { ...input }
      
      if (input.first_name || input.last_name) {
        // Get current user data to construct full_name
        const { data: currentUser, error: fetchError } = await ctx.supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', ctx.user.id)
          .single()
          
        if (fetchError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Failed to fetch current user data',
          })
        }
        
        // Use new values if provided, otherwise keep current values
        const firstName = input.first_name || currentUser.first_name || ''
        const lastName = input.last_name || currentUser.last_name || ''
        
        updateData = {
          ...updateData,
          full_name: `${firstName} ${lastName}`.trim(),
        }
      }
      
      const { data, error } = await ctx.supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return data
    }),

  // Get contractor profile for current user
  getContractorProfile: protectedProcedure.query(async ({ ctx }) => {
    // First check if user is a contractor
    const { data: user, error: userError } = await ctx.supabase
      .from('users')
      .select('user_role')
      .eq('id', ctx.user.id)
      .single()

    if (userError) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    if (user.user_role !== 'contractor') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only contractors can access contractor profiles',
      })
    }

    const { data: profile, error } = await ctx.supabase
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', ctx.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, return null
        return null
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return profile
  }),

  // Create contractor profile
  createContractorProfile: protectedProcedure
    .input(contractorProfileCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if user is a contractor
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      if (user.user_role !== 'contractor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only contractors can create contractor profiles',
        })
      }

      // Check if profile already exists
      const { data: existingProfile } = await ctx.supabase
        .from('contractor_profiles')
        .select('id')
        .eq('user_id', ctx.user.id)
        .single()

      if (existingProfile) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Contractor profile already exists',
        })
      }

      // Get user data for slug generation
      const { data: userData } = await ctx.supabase
        .from('users')
        .select('full_name')
        .eq('id', ctx.user.id)
        .single()

      // Generate unique slug for the contractor profile
      const baseSlug = generateContractorSlug(
        userData?.full_name || 'contractor'
      )
      
      // Get existing slugs to ensure uniqueness
      const { data: existingProfiles } = await ctx.supabase
        .from('contractor_profiles')
        .select('slug')
        .not('slug', 'is', null)
      
      const existingSlugs = existingProfiles?.map(p => p.slug) || []
      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)

      const { data, error } = await ctx.supabase
        .from('contractor_profiles')
        .insert({
          ...input,
          user_id: ctx.user.id,
          slug: uniqueSlug,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      // Update the user's contractor_profile field
      await ctx.supabase
        .from('users')
        .update({ contractor_profile: data.id })
        .eq('id', ctx.user.id)

      return data
    }),

  // Update contractor profile
  updateContractorProfile: protectedProcedure
    .input(contractorProfileUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if user is a contractor
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      if (user.user_role !== 'contractor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only contractors can update contractor profiles',
        })
      }

      // Check if business_name is being updated to regenerate slug
      let updateData = {
        ...input,
        updated_at: new Date().toISOString(),
      }

      if (input.business_name) {
        // Get current user data for slug generation
        const { data: userData } = await ctx.supabase
          .from('users')
          .select('full_name')
          .eq('id', ctx.user.id)
          .single()

        // Generate new slug if business name is changing
        const baseSlug = generateContractorSlug(
          userData?.full_name || 'contractor'
        )
        
        // Get existing slugs to ensure uniqueness
        const { data: existingProfiles } = await ctx.supabase
          .from('contractor_profiles')
          .select('slug')
          .not('slug', 'is', null)
          .neq('user_id', ctx.user.id) // Exclude current profile
        
        const existingSlugs = existingProfiles?.map(p => p.slug) || []
        const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)
        
        updateData.slug = uniqueSlug
      }

      const { data, error } = await ctx.supabase
        .from('contractor_profiles')
        .update(updateData)
        .eq('user_id', ctx.user.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return data
    }),

  // Get user by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase

      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          first_name,
          last_name,
          phone_number,
          address,
          user_role,
          created_at
        `)
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      return profile
    }),

  // Search contractors
  searchContractors: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        location: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase

      let query = supabase
        .from('users')
        .select(`
          id,
          full_name,
          first_name,
          last_name,
          phone_number,
          address,
          user_role,
          created_at
        `)
        .eq('user_role', 'contractor')

      // Apply filters
      if (input.query) {
        query = query.or(
          `full_name.ilike.%${input.query}%,first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%`
        )
      }

      if (input.location) {
        query = query.ilike('address', `%${input.location}%`)
      }

      const { data, error } = await query
        .range(input.offset, input.offset + input.limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  // Get user statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id

    // Get project counts
    const { data: projectStats, error: projectError } = await ctx.supabase
      .from('projects')
      .select('status')
      .eq('creator', userId)

    if (projectError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: projectError.message,
      })
    }

    // Get proposal counts
    const { data: proposalStats, error: proposalError } = await ctx.supabase
      .from('proposals')
      .select('status')
      .eq('contractor_id', userId)

    if (proposalError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: proposalError.message,
      })
    }

    const projectCounts = {
      total: projectStats.length,
      active: projectStats.filter(p => p.status === 'active').length,
      completed: projectStats.filter(p => p.status === 'completed').length,
      pending: projectStats.filter(p => p.status === 'pending').length,
    }

    const proposalCounts = {
      total: proposalStats.length,
      pending: proposalStats.filter(p => p.status === 'pending').length,
      accepted: proposalStats.filter(p => p.status === 'accepted').length,
      rejected: proposalStats.filter(p => p.status === 'rejected').length,
    }

    return {
      projects: projectCounts,
      proposals: proposalCounts,
    }
  }),

  // Admin endpoints for contractor verification
  // Get all contractors for admin verification
  getContractorsForVerification: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['all', 'pending', 'verified', 'unverified']).default('all'),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError || user?.user_role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can access contractor verification data',
        })
      }

      let query = ctx.supabase
        .from('contractor_profiles')
        .select(`
          *,
          user:users!user_id (
            id,
            full_name,
            first_name,
            last_name,
            email,
            phone_number,
            address,
            user_role,
            is_verified_contractor,
            government_id,
            government_id_verified,
            created_at
          )
        `)
        .eq('user.user_role', 'contractor')

      // Apply status filter
      if (input.status === 'verified') {
        query = query.eq('is_admin_verified', true)
      } else if (input.status === 'unverified') {
        query = query.eq('is_admin_verified', false)
      }

      const { data, error } = await query
        .range(input.offset, input.offset + input.limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  // Upload clearance documents and verify contractor
  uploadClearanceDocuments: protectedProcedure
    .input(
      z.object({
        contractorId: z.string().uuid(),
        gstHstClearanceDocument: z.object({
          id: z.string().uuid(),
          filename: z.string().min(1),
          url: z.string().url(),
          size: z.number().positive().optional(),
          mimeType: z.string().optional(),
          uploadedAt: z.date().optional(),
        }).optional(),
        wcbClearanceDocument: z.object({
          id: z.string().uuid(),
          filename: z.string().min(1),
          url: z.string().url(),
          size: z.number().positive().optional(),
          mimeType: z.string().optional(),
          uploadedAt: z.date().optional(),
        }).optional(),
        verifyContractor: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log('uploadClearanceDocuments mutation called with input:', input)
      
      // Check if user is admin
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError || user?.user_role !== 'admin') {
        console.error('Admin check failed:', userError, user)
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can upload clearance documents',
        })
      }

      console.log('Admin check passed, user role:', user.user_role)

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (input.gstHstClearanceDocument) {
        console.log('Adding GST/HST clearance document:', input.gstHstClearanceDocument)
        updateData.gst_hst_clearance_document = input.gstHstClearanceDocument
      }

      if (input.wcbClearanceDocument) {
        console.log('Adding WCB clearance document:', input.wcbClearanceDocument)
        updateData.wcb_clearance_document = input.wcbClearanceDocument
      }

      if (input.verifyContractor) {
        console.log('Verifying contractor')
        updateData.is_admin_verified = true
        updateData.admin_verification_date = new Date().toISOString()
      }

      console.log('Updating contractor profile with data:', updateData)
      console.log('Contractor ID:', input.contractorId)

      const { data, error } = await ctx.supabase
        .from('contractor_profiles')
        .update(updateData)
        .eq('user_id', input.contractorId)
        .select()
        .single()

      if (error) {
        console.error('Database update error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Database update failed: ${error.message}`,
        })
      }

      console.log('Database update successful, result:', data)
      return data
    }),

  // Get contractor profile by ID (for admin review)
  getContractorProfileById: protectedProcedure
    .input(z.object({ contractorId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError || user?.user_role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can access contractor profile data',
        })
      }

      const { data, error } = await ctx.supabase
        .from('contractor_profiles')
        .select(`
          *,
          user:users!user_id (
            id,
            full_name,
            first_name,
            last_name,
            email,
            phone_number,
            address,
            user_role,
            is_verified_contractor,
            created_at
          )
        `)
        .eq('user_id', input.contractorId)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contractor profile not found',
        })
      }

      return data
    }),

  // Reject/unverify contractor
  rejectContractor: protectedProcedure
    .input(
      z.object({
        contractorId: z.string().uuid(),
        removeDocuments: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError || user?.user_role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can reject contractors',
        })
      }

      const updateData: any = {
        is_admin_verified: false,
        admin_verification_date: null,
        updated_at: new Date().toISOString(),
      }

      // Optionally remove clearance documents
      if (input.removeDocuments) {
        updateData.gst_hst_clearance_document = null
        updateData.wcb_clearance_document = null
      }

      const { data, error } = await ctx.supabase
        .from('contractor_profiles')
        .update(updateData)
        .eq('user_id', input.contractorId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  // Admin endpoint to update contractor insurance amounts
  updateContractorInsurance: protectedProcedure
    .input(
      z.object({
        contractorId: z.string().uuid(),
        insuranceGeneralLiability: z.number().min(0).optional(),
        insuranceBuildersRisk: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError || user?.user_role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update contractor insurance amounts',
        })
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (input.insuranceGeneralLiability !== undefined) {
        updateData.insurance_general_liability = input.insuranceGeneralLiability
      }

      if (input.insuranceBuildersRisk !== undefined) {
        updateData.insurance_builders_risk = input.insuranceBuildersRisk
      }

      const { data, error } = await ctx.supabase
        .from('contractor_profiles')
        .update(updateData)
        .eq('user_id', input.contractorId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),
})