import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '~/server/trpc'
import { TRPCError } from '@trpc/server'
import { VISIBILITY_SETTINGS, PROJECT_TYPES, PROJECT_STATUSES } from '@/utils/constants'

const projectSchema = z.object({
  project_title: z.string().min(1, 'Project title is required'),
  statement_of_work: z.string().min(1, 'Statement of work is required'),
  budget: z.number().positive('Budget must be a positive number'),
  category: z.array(z.string()).min(1, 'At least one category is required'),
  pid: z.string()
    .min(1, 'Parcel Identifier is required')
    .regex(/^\d{9}$/, 'Parcel Identifier must be exactly 9 digits'),
  location: z.object({
    address: z.string().min(1, 'Location address is required'),
    latitude: z.number().min(-90).max(90, 'Valid latitude coordinates are required'),
    longitude: z.number().min(-180).max(180, 'Valid longitude coordinates are required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  project_type: z.enum(Object.values(PROJECT_TYPES)),
        visibility_settings: z.enum([VISIBILITY_SETTINGS.PRIVATE, VISIBILITY_SETTINGS.SHARED_WITH_TARGET_USER, VISIBILITY_SETTINGS.SHARED_WITH_PARTICIPANT, VISIBILITY_SETTINGS.PUBLIC_TO_INVITEES, VISIBILITY_SETTINGS.PUBLIC_TO_MARKETPLACE, VISIBILITY_SETTINGS.ADMIN_ONLY]),
  start_date: z.date(),
  end_date: z.date(),
  expiry_date: z.date(),
  decision_date: z.date(),
  permit_required: z.boolean().default(false),
  substantial_completion: z.date().optional(),
  is_verified_project: z.boolean().default(false),
  delay_penalty: z.number().min(0).default(0),
  abandonment_penalty: z.number().min(0).default(0),
  project_photos: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string().min(1),
    url: z.string().url(),
    size: z.number().positive().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  })).min(1, 'At least one project photo is required'),
  certificate_of_title: z.string().url().optional(),
  files: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string().min(1),
    url: z.string().url(),
    size: z.number().positive().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  })).default([]),
})

export const projectsRouter = router({
  // Create a new project
  create: protectedProcedure
    .input(projectSchema)
    .mutation(async ({ input, ctx }) => {

      console.log('input', input)
      const { data, error } = await ctx.supabase
        .from('projects')
        .insert({
          ...input,
          creator: ctx.user.id,
          status: PROJECT_STATUSES.OPEN_FOR_PROPOSALS,
          proposal_count: 0,
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return data
    }),

  // Update substantial completion date
  updateSubstantialCompletion: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      substantialCompletion: z.string().min(1, 'Date is required').refine(
        (date) => {
          const completionDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          completionDate.setHours(0, 0, 0, 0);
          return completionDate <= today;
        },
        { message: 'Substantial completion date cannot be in the future' }
      )
    }))
    .mutation(async ({ input, ctx }) => {
      const { projectId, substantialCompletion } = input;
      
      console.log('updateSubstantialCompletion called:', { projectId, substantialCompletion, userId: ctx.user.id });

      // Check if project exists and is in "Proposal Selected" status
      const { data: project, error: projectError } = await ctx.supabase
        .from('projects')
        .select('id, status, creator, after_photo')
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (project.status !== 'Proposal Selected') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Substantial completion can only be set for projects with Proposal Selected status',
        });
      }

      // Check if after photo has been uploaded
      if (!project.after_photo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'After photo must be uploaded before setting substantial completion date',
        });
      }

      // Check if user is the project creator (homeowner)
      const isCreator = project.creator === ctx.user.id;
      
      // Check if user is the contractor for this project
      const { data: proposal } = await ctx.supabase
        .from('proposals')
        .select('id, contractor, status')
        .eq('project', projectId)
        .eq('contractor', ctx.user.id)
        .eq('status', 'accepted')
        .single();

      const isContractor = !!proposal;

      if (!isCreator && !isContractor) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the project owner or selected contractor can set substantial completion date',
        });
      }

      // Update the project
      const { data, error } = await ctx.supabase
        .from('projects')
        .update({ 
          substantial_completion: substantialCompletion,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update substantial completion date: ${error.message}`,
        });
      }

      console.log('Substantial completion date updated successfully:', data);
      return data;
    }),

  // Get all projects (public with filters)
  getAll: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        location: z.string().optional(),
        minBudget: z.number().optional(),
        maxBudget: z.number().optional(),
        status: z.enum(Object.values(PROJECT_STATUSES)).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase

      let query = supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_creator_fkey (
            id,
            full_name,
            location
          )
        `)

      // Apply filters
      if (input.category) {
        query = query.eq('category', input.category)
      }

      if (input.location) {
        query = query.ilike('location', `%${input.location}%`)
      }

      if (input.minBudget !== undefined) {
        query = query.gte('budget', input.minBudget)
      }

      if (input.maxBudget !== undefined) {
        query = query.lte('budget', input.maxBudget)
      }

      if (input.status) {
        query = query.eq('status', input.status)
      }

      if (input.search) {
        query = query.or(
          `title.ilike.%${input.search}%,description.ilike.%${input.search}%`
        )
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

  // Get project by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase || (() => {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Supabase client not available',
        })
      })()

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          homeowner:users!projects_creator_fkey (
            id,
            full_name,
            email,
            address
          ),
          proposals (
            id,
            contractor,
            total_amount,
            proposed_start_date,
            proposed_end_date,
            status,
            created_at,
            users!proposals_contractor_fkey (
              id,
              full_name
            )
          )
        `)
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      return data
    }),

  // Get user's projects
  getMy: protectedProcedure
    .input(
      z.object({
        status: z.enum(Object.values(PROJECT_STATUSES)).optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase
        .from('projects')
        .select(`
          *,
          proposals (
            id,
            contractor_id,
            amount,
            status,
            users!proposals_contractor_fkey (
              id,
              full_name
            )
          )
        `)
        .eq('creator', ctx.user.id)

      if (input.status) {
        query = query.eq('status', input.status)
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

  // Update project
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        ...projectSchema.partial().shape,
        status: z.enum(Object.values(PROJECT_STATUSES)).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      // Check if user owns the project
      const { data: existingProject, error: fetchError } = await ctx.supabase
        .from('projects')
        .select('creator')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      if (existingProject.creator !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own projects',
        })
      }

      const { data, error } = await ctx.supabase
        .from('projects')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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

  // Update project amenities
  updateAmenities: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        site_amenities: z.object({
          power: z.array(z.string()).default([]),
          sanitation: z.array(z.string()).default([]),
          water: z.array(z.string()).default([]),
          parking: z.array(z.string()).default([]),
          comfort: z.array(z.string()).default([]),
          safety: z.array(z.string()).default([]),
          security: z.array(z.string()).default([]),
          logistics: z.array(z.string()).default([]),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, site_amenities } = input

      // Check if user owns the project
      const { data: existingProject, error: fetchError } = await ctx.supabase
        .from('projects')
        .select('creator')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      if (existingProject.creator !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own projects',
        })
      }

      const { data, error } = await ctx.supabase
        .from('projects')
        .update({
          site_amenities,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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

  // Delete project
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if user owns the project
      const { data: existingProject, error: fetchError } = await ctx.supabase
        .from('projects')
        .select('creator')
        .eq('id', input.id)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      if (existingProject.creator !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own projects',
        })
      }

      const { error } = await ctx.supabase
        .from('projects')
        .delete()
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return { success: true }
    }),

  // Get project categories
  getCategories: publicProcedure
    .query(async ({ ctx }) => {
    const supabase = ctx.supabase

    const { data, error } = await supabase
      .from('projects')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))]
    return categories.sort()
  }),

  // Check project access status for a contractor
  checkProjectAccess: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { projectId, userId } = input
      const supabase = ctx.supabase

      // Verify the requesting user is the same as userId or has admin privileges
      // First fetch the user role from the database
      const { data: userData, error: userError } = await supabase
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

      if (ctx.user.id !== userId && userData.user_role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only check your own project access',
        })
      }

      // Check if user has access to this project
      const { data: projectViews, error: viewError } = await supabase
        .from('project_views')
        .select('id, is_active, expires_at, access_method, can_submit_proposal')
        .eq('contractor', userId)
        .eq('project', projectId)
        .eq('is_active', 'yes')
        .limit(1)

      if (viewError) {
        console.error('Error checking project access:', viewError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check project access',
        })
      }

      const projectView = projectViews && projectViews.length > 0 ? projectViews[0] : null
      console.log('Project view found:', projectView)

      const hasAccess = projectView && 
        (!projectView.expires_at || new Date(projectView.expires_at) > new Date())
      
      console.log('Has access:', hasAccess, 'expires_at:', projectView?.expires_at)

      // Check verification status
      const { data: verificationData } = await supabase
        .from('users')
        .select('is_verified_contractor')
        .eq('id', userId)
        .single()

      const isVerified = verificationData?.is_verified_contractor || false

      return {
        hasAccess: !!hasAccess,
        canSubmitProposal: hasAccess ? projectView.can_submit_proposal === 'yes' : false,
        isVerified,
        accessMethod: projectView?.access_method || null,
        expiresAt: projectView?.expires_at || null,
      }
    }),
})