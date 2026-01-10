import { z } from 'zod'
import { router, protectedProcedure } from '~/server/trpc'
import { TRPCError } from '@trpc/server'

export const adminRouter = router({
  // Get projects for feature management
  getProjectsForFeatureManagement: protectedProcedure
    .query(async ({ ctx }) => {
      // Check if user is admin
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError || user?.user_role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can access feature management data',
        })
      }

      const { data, error } = await ctx.supabase
        .from('projects')
        .select(`
          id,
          project_title,
          budget,
          status,
          is_featured_project,
          created_at,
          homeowner:users!creator (
            id,
            full_name,
            email
          )
        `)
        .eq('status', 'Completed')
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  // Get contractors for feature management
  getContractorsForFeatureManagement: protectedProcedure
    .query(async ({ ctx }) => {
      // Check if user is admin
      const { data: user, error: userError } = await ctx.supabase
        .from('users')
        .select('user_role')
        .eq('id', ctx.user.id)
        .single()

      if (userError || user?.user_role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can access feature management data',
        })
      }

      const { data, error } = await ctx.supabase
        .from('contractor_profiles')
        .select(`
          id,
          business_name,
          trade_category,
          is_featured_contractor,
          is_admin_verified,
          created_at,
          user:users!user_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  // Toggle featured project
  toggleFeaturedProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        isFeatured: z.boolean(),
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
          message: 'Only admins can manage featured projects',
        })
      }

      const { error } = await ctx.supabase
        .from('projects')
        .update({ is_featured_project: input.isFeatured })
        .eq('id', input.projectId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return { success: true }
    }),

  // Toggle featured contractor
  toggleFeaturedContractor: protectedProcedure
    .input(
      z.object({
        contractorId: z.string(),
        isFeatured: z.boolean(),
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
          message: 'Only admins can manage featured contractors',
        })
      }

      const { error } = await ctx.supabase
        .from('contractor_profiles')
        .update({ is_featured_contractor: input.isFeatured })
        .eq('id', input.contractorId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return { success: true }
    }),
})
