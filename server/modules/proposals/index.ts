import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '~/server/trpc'
import { TRPCError } from '@trpc/server'
import { proposalSchema, proposalCreateSchema, proposalUpdateSchema } from '@/server/database/schemas/proposals'
import { VISIBILITY_SETTINGS, PROPOSAL_STATUSES, REJECTION_REASONS } from '@/utils/constants'

export const proposalsRouter = router({
  // Create a new proposal
  create: protectedProcedure
    .input(proposalCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if project exists and is not completed/cancelled
      const { data: project, error: projectError } = await ctx.supabase
        .from('projects')

        .select('id, status, homeowner')
        .eq('id', input.project)
        .single()

      if (projectError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      if (project.status === 'completed' || project.status === 'cancelled') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot submit proposal for completed or cancelled projects',
        })
      }

      if (project.homeowner === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot submit a proposal for your own project',
        })
      }

      // Check if user already has a proposal for this project
      const { data: existingProposal } = await ctx.supabase
        .from('proposals')
        .select('id')
        .eq('project', input.project)
        .eq('contractor', ctx.user.id)
        .eq('status', 'draft')
        .single()

      if (existingProposal) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already submitted a proposal for this project',
        })
      }

      const { data, error } = await ctx.supabase
        .from('proposals')
        .insert({
          title: input.title,
          description_of_work: input.description_of_work,
          project: input.project,
        contractor: input.contractor,
        homeowner: input.homeowner,
          subtotal_amount: input.subtotal_amount,
          tax_included: input.tax_included,
          total_amount: input.total_amount,
          deposit_amount: input.deposit_amount,
          deposit_due_on: input.deposit_due_on,
          delay_penalty: input.delay_penalty,
          proposed_start_date: input.proposed_start_date,
          proposed_end_date: input.proposed_end_date,
          expiry_date: input.expiry_date,
          clause_preview_html: input.clause_preview_html,
          attached_files: input.attached_files || [],
          notes: input.notes,
          work_guarantee_statement: input.work_guarantee_statement,
          visibility_settings: input.visibility_settings || 'private',
          status: 'draft',
          created_by: ctx.user.id,
        last_modified_by: ctx.user.id,
          last_updated: new Date(),
        })
        .select(`
          *,
          project:projects (
            id,
            title,
            homeowner_id,
            users!projects_homeowner_id_fkey (
              id,
              full_name
            )
          ),
          contractor:users!proposals_contractor_fkey (
            id,
            full_name
          )
        `)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return data
    }),

  // Get proposals for a project
  getByProject: publicProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase

      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          contractor:users!proposals_contractor_fkey (
            id,
            full_name
          )
        `)
        .eq('project', input.projectId)
        .eq('is_deleted', 'no')
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  // Get user's proposals (contractor view)
  getMy: protectedProcedure
    .input(
      z.object({
        status: z.enum([PROPOSAL_STATUSES.DRAFT, PROPOSAL_STATUSES.SUBMITTED, PROPOSAL_STATUSES.VIEWED, PROPOSAL_STATUSES.ACCEPTED, PROPOSAL_STATUSES.REJECTED, PROPOSAL_STATUSES.WITHDRAWN, PROPOSAL_STATUSES.EXPIRED]).optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase
        .from('proposals')
        .select(`
          *,
          project
        `)
        .eq('contractor', ctx.user.id)
        .eq('is_deleted', 'no')

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

  // Get proposals received (homeowner view)
  getReceived: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid().optional(),
        status: z.enum([PROPOSAL_STATUSES.DRAFT, PROPOSAL_STATUSES.SUBMITTED, PROPOSAL_STATUSES.VIEWED, PROPOSAL_STATUSES.ACCEPTED, PROPOSAL_STATUSES.REJECTED, PROPOSAL_STATUSES.WITHDRAWN, PROPOSAL_STATUSES.EXPIRED]).optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase
        .from('proposals')
        .select(`
          *,
          project:projects!inner (
            id,
            title,
            description,
            category,
            location,
            status,
            budget,
            homeowner_id
          ),
          contractor:users!proposals_contractor_fkey (
            id,
            full_name
          )
        `)
        .eq('homeowner', ctx.user.id)
        .eq('is_deleted', 'no')

      if (input.projectId) {
        query = query.eq('project', input.projectId)
      }

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

  // Get proposal by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('proposals')
        .select(`
          *,
          project:projects (
            id,
            title,
            description,
            category,
            location,
            status,
            budget,
            homeowner_id,
            users!projects_homeowner_id_fkey (
              id,
              full_name,
              location
            )
          ),
          contractor:users!proposals_contractor_fkey (
            id,
            full_name
          )
        `)
        .eq('id', input.id)
        .eq('is_deleted', 'no')
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        })
      }

      // Check if user has access to this proposal
      const isContractor = data.contractor === ctx.user.id
      const isHomeowner = data.homeowner === ctx.user.id

      if (!isContractor && !isHomeowner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this proposal',
        })
      }

      return data
    }),

  // Update proposal status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum([PROPOSAL_STATUSES.DRAFT, PROPOSAL_STATUSES.SUBMITTED, PROPOSAL_STATUSES.VIEWED, PROPOSAL_STATUSES.ACCEPTED, PROPOSAL_STATUSES.REJECTED, PROPOSAL_STATUSES.WITHDRAWN, PROPOSAL_STATUSES.EXPIRED]),
        rejection_reason: z.enum([REJECTION_REASONS.INCOMPLETE_PROPOSAL, REJECTION_REASONS.TOO_EXPENSIVE, REJECTION_REASONS.TIMELINE_TOO_LONG, REJECTION_REASONS.OUT_OF_SCOPE_ITEMS, REJECTION_REASONS.OTHER]).optional(),
        rejection_reason_notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, status, rejection_reason, rejection_reason_notes } = input

      // Check if user has access to this proposal
      const { data: existingProposal, error: fetchError } = await ctx.supabase
        .from('proposals')
        .select('contractor, homeowner, status')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        })
      }

      const isContractor = existingProposal.contractor === ctx.user.id
      const isHomeowner = existingProposal.homeowner === ctx.user.id

      if (!isContractor && !isHomeowner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this proposal',
        })
      }

      // Only contractors can submit/withdraw, only homeowners can accept/reject
      if (status === PROPOSAL_STATUSES.SUBMITTED || status === PROPOSAL_STATUSES.WITHDRAWN) {
        if (!isContractor) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only contractors can submit or withdraw proposals',
          })
        }
      }

      if (status === PROPOSAL_STATUSES.ACCEPTED || status === PROPOSAL_STATUSES.REJECTED) {
        if (!isHomeowner) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only homeowners can accept or reject proposals',
          })
        }
      }

      // Prepare update data
      const updateData: any = {
        status,
        last_updated: new Date(),
        last_modified_by: ctx.user.id,
      }

      // Add status-specific fields
      if (status === PROPOSAL_STATUSES.SUBMITTED) {
        updateData.submitted_date = new Date()
      } else if (status === PROPOSAL_STATUSES.ACCEPTED) {
        updateData.accepted_date = new Date()
      } else if (status === PROPOSAL_STATUSES.REJECTED) {
        updateData.rejected_date = new Date()
        updateData.rejected_by_id = ctx.user.id
        if (rejection_reason) {
          updateData.rejection_reason = rejection_reason
        }
        if (rejection_reason_notes) {
          updateData.rejection_reason_notes = rejection_reason_notes
        }
      } else if (status === PROPOSAL_STATUSES.WITHDRAWN) {
        updateData.withdrawn_date = new Date()
      }

      const { data, error } = await ctx.supabase
        .from('proposals')
        .update(updateData)
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

  // Update proposal (contractor only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        description_of_work: z.string().optional(),
        subtotal_amount: z.number().positive().optional(),
        tax_included: z.enum(['yes', 'no']).optional(),
        total_amount: z.number().positive().optional(),
        deposit_amount: z.number().positive().optional(),
        deposit_due_on: z.date().optional(),
        delay_penalty: z.number().min(0).optional(),
        proposed_start_date: z.date().optional(),
        proposed_end_date: z.date().optional(),
        expiry_date: z.date().optional(),
        clause_preview_html: z.string().optional(),
        attached_files: z.array(z.object({
          id: z.string().uuid(),
          filename: z.string(),
          url: z.string().url(),
          size: z.number().positive().optional(),
          mimeType: z.string().optional(),
          uploadedAt: z.date().optional(),
        })).optional(),
        notes: z.string().optional(),
        work_guarantee_statement: z.string().optional(),
                  visibility_settings: z.enum([VISIBILITY_SETTINGS.PRIVATE, VISIBILITY_SETTINGS.SHARED_WITH_TARGET_USER, VISIBILITY_SETTINGS.SHARED_WITH_PARTICIPANT, VISIBILITY_SETTINGS.PUBLIC_TO_INVITEES, VISIBILITY_SETTINGS.PUBLIC_TO_MARKETPLACE, VISIBILITY_SETTINGS.ADMIN_ONLY]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      // Check if user owns the proposal and it's still editable
      const { data: existingProposal, error: fetchError } = await ctx.supabase
        .from('proposals')
        .select('contractor, status')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        })
      }

      if (existingProposal.contractor !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own proposals',
        })
      }

      if (![PROPOSAL_STATUSES.DRAFT, PROPOSAL_STATUSES.SUBMITTED].includes(existingProposal.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only update draft or submitted proposals',
        })
      }

      const finalUpdateData = {
        ...updateData,
        last_updated: new Date(),
        last_modified_by: ctx.user.id,
      }

      const { data, error } = await ctx.supabase
        .from('proposals')
        .update(finalUpdateData)
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

  // Soft delete proposal (contractor only)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if user owns the proposal
      const { data: existingProposal, error: fetchError } = await ctx.supabase
        .from('proposals')
        .select('contractor_id, status')
        .eq('id', input.id)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        })
      }

      if (existingProposal.contractor_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own proposals',
        })
      }

      // Soft delete by setting is_deleted flag
      const { error } = await ctx.supabase
        .from('proposals')
        .update({
          is_deleted: 'yes',
          last_updated: new Date(),
          last_modified_by: ctx.user.id,
        })
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return { success: true }
    }),

  // Mark proposal as viewed (homeowner only)
  markAsViewed: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is the homeowner for this proposal
      const { data: existingProposal, error: fetchError } = await ctx.supabase
        .from('proposals')
        .select('homeowner')
        .eq('id', input.id)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        })
      }

      if (existingProposal.homeowner !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only mark your own proposals as viewed',
        })
      }

      const { error } = await ctx.supabase
        .from('proposals')
        .update({
          viewed_date: new Date(),
          last_updated: new Date(),
          last_modified_by: ctx.user.id,
        })
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return { success: true }
    }),

  // Get contractor's proposals for a specific project
  getByContractorAndProject: protectedProcedure
    .input(z.object({ 
      projectId: z.string().uuid(),
      contractorId: z.string().uuid()
    }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('proposals')
        .select(`
          id,
          status,
          created_at,
          updated_at
        `)
        .eq('project', input.projectId)
        .eq('contractor', input.contractorId)
        .eq('is_deleted', 'no')
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),
})