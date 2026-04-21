import { z } from 'zod'
import { baseSchema, commonEnums, validationPatterns } from './base'

export const projectViewSchema = z.object({
  ...baseSchema,
  
  // Core view fields
  access_method: commonEnums.accessMethod,
  can_submit_proposal: validationPatterns.yesNo,
  contractor: validationPatterns.uuid,
  created_by: validationPatterns.uuid,
  expires_at: validationPatterns.optionalDate,
  is_active: validationPatterns.yesNo,
  payment_transaction: validationPatterns.uuid.optional(),
  project: validationPatterns.uuid,
  view_status: commonEnums.viewStatus,
  viewed_at: validationPatterns.date,
  was_paid_view: validationPatterns.yesNo,
})

export type ProjectView = z.infer<typeof projectViewSchema>
