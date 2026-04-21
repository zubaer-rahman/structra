import { z } from 'zod'
import { baseSchema, commonEnums, validationPatterns } from './base'
import { PROPOSAL_STATUSES, VISIBILITY_SETTINGS } from '@/utils/constants'

export const proposalSchema = z.object({
  ...baseSchema,
  // Core proposal fields
  title: validationPatterns.nonEmptyString,
  description_of_work: validationPatterns.nonEmptyString,
  
  // Project and user relationships (flat ID references)
  project: validationPatterns.uuid,
  contractor: validationPatterns.uuid,
  homeowner: validationPatterns.uuid,
  
  // Financial fields
  subtotal_amount: validationPatterns.amount,
  tax_included: validationPatterns.yesNo,
  total_amount: validationPatterns.amount,
  deposit_amount: validationPatterns.amount,
  deposit_due_on: validationPatterns.date,
  delay_penalty: z.number().min(0).default(0),
  abandonment_penalty: z.number().min(0).default(0),
  
  // Timeline fields
  proposed_start_date: validationPatterns.date,
  proposed_end_date: validationPatterns.date,
  expiry_date: validationPatterns.date,
  
  // Status and workflow fields
  status: commonEnums.proposalStatus.default(PROPOSAL_STATUSES.DRAFT),
  is_selected: validationPatterns.yesNo.default('no'),
  is_deleted: validationPatterns.yesNo.default('no'),
  
  // Dates and timestamps
  submitted_date: validationPatterns.optionalDate,
  accepted_date: validationPatterns.optionalDate,
  rejected_date: validationPatterns.optionalDate,
  withdrawn_date: validationPatterns.optionalDate,
  viewed_date: validationPatterns.optionalDate,
  last_updated: validationPatterns.date,
  
  // Rejection handling
  rejected_by: validationPatterns.uuid.optional(),
  rejection_reason: commonEnums.rejectionReason.optional(),
  rejection_reason_notes: validationPatterns.optionalString,
  
  // Content and documentation
  clause_preview_html: validationPatterns.htmlContent,
  attached_files: z.array(validationPatterns.fileReference).default([]),
  notes: validationPatterns.optionalString,
  
  // Trade category removed - not in database schema
  
  // Work guarantee statement from contractor profile
  work_guarantee_statement: validationPatterns.optionalString,
  
  // Relationships and references
  agreement: validationPatterns.uuid.optional(),
  proposals: z.array(validationPatterns.uuid).default([]),
  
  // User tracking
  created_by: validationPatterns.uuid,
  last_modified_by: validationPatterns.uuid,
  
  // Visibility and sharing
  visibility_settings: commonEnums.visibilitySettings.default(VISIBILITY_SETTINGS.PRIVATE),
})

export const proposalCreateSchema = proposalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  is_selected: true,
  is_deleted: true,
  submitted_date: true,
  accepted_date: true,
  rejected_date: true,
  withdrawn_date: true,
  viewed_date: true,
  last_updated: true,
  rejected_by: true,
  rejection_reason: true,
  rejection_reason_notes: true,
  agreement: true,
  last_modified_by: true,
})

export const proposalUpdateSchema = proposalSchema.partial().omit({
  id: true,
  createdAt: true,
  project: true,
  contractor: true,
  homeowner: true,
  created_by: true,
})

export const proposalStatusUpdateSchema = z.object({
  proposal_id: validationPatterns.uuid,
  new_status: commonEnums.proposalStatus,
  status_reason: validationPatterns.optionalString,
  updated_by: validationPatterns.uuid,
})

export const proposalResubmissionSchema = z.object({
  original_proposal_id: validationPatterns.uuid,
  new_subtotal_amount: validationPatterns.amount,
  new_description_of_work: validationPatterns.nonEmptyString,
  new_timeline: z.object({
    proposed_start_date: validationPatterns.date,
    proposed_end_date: validationPatterns.date,
  }),
  resubmission_reason: validationPatterns.optionalString,
})

export const proposalSearchSchema = z.object({
  project: validationPatterns.uuid.optional(),
  contractor: validationPatterns.uuid.optional(),
  homeowner: validationPatterns.uuid.optional(),
  status: commonEnums.proposalStatus.optional(),
  subtotal_amount_min: validationPatterns.optionalNumber,
  subtotal_amount_max: validationPatterns.optionalNumber,
  date_from: validationPatterns.optionalDate,
  date_to: validationPatterns.optionalDate,
  is_selected: validationPatterns.yesNo.optional(),
})

export const proposalComparisonSchema = z.object({
  proposal_ids: z.array(validationPatterns.uuid).min(2),
  comparison_criteria: z.array(z.enum(['price', 'timeline', 'experience', 'rating', 'availability'])),
})

export const proposalFeedbackSchema = z.object({
  proposal_id: validationPatterns.uuid,
  feedback_type: z.enum(['acceptance', 'rejection', 'revision_request', 'question']),
  feedback_message: validationPatterns.nonEmptyString,
  feedback_by: validationPatterns.uuid,
  feedback_date: z.date(),
})

export const proposalRevisionRequestSchema = z.object({
  proposal_id: validationPatterns.uuid,
  requested_changes: z.array(validationPatterns.nonEmptyString),
  revision_deadline: z.date(),
  revision_notes: validationPatterns.optionalString,
  requested_by: validationPatterns.uuid,
})

export type Proposal = z.infer<typeof proposalSchema>
export type ProposalCreate = z.infer<typeof proposalCreateSchema>
export type ProposalUpdate = z.infer<typeof proposalUpdateSchema>
export type ProposalStatusUpdate = z.infer<typeof proposalStatusUpdateSchema>
export type ProposalResubmission = z.infer<typeof proposalResubmissionSchema>
export type ProposalSearch = z.infer<typeof proposalSearchSchema>
export type ProposalComparison = z.infer<typeof proposalComparisonSchema>
export type ProposalFeedback = z.infer<typeof proposalFeedbackSchema>
export type ProposalRevisionRequest = z.infer<typeof proposalRevisionRequestSchema>

export const validateProposal = (data: unknown): Proposal => proposalSchema.parse(data)
export const validateProposalCreate = (data: unknown): ProposalCreate => proposalCreateSchema.parse(data)
export const validateProposalUpdate = (data: unknown): ProposalUpdate => proposalUpdateSchema.parse(data)
export const validateProposalStatusUpdate = (data: unknown): ProposalStatusUpdate => proposalStatusUpdateSchema.parse(data)
export const validateProposalResubmission = (data: unknown): ProposalResubmission => proposalResubmissionSchema.parse(data)
export const validateProposalSearch = (data: unknown): ProposalSearch => proposalSearchSchema.parse(data)
export const validateProposalComparison = (data: unknown): ProposalComparison => proposalComparisonSchema.parse(data)
export const validateProposalFeedback = (data: unknown): ProposalFeedback => proposalFeedbackSchema.parse(data)
export const validateProposalRevisionRequest = (data: unknown): ProposalRevisionRequest => proposalRevisionRequestSchema.parse(data)
