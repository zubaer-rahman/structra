import { z } from 'zod'
import { baseSchema, commonEnums, validationPatterns } from './base'

export const subscriptionSchema = z.object({
  ...baseSchema,
  
  // Core subscription fields
  cancellation_reason: validationPatterns.optionalString, // Reason provided for cancelling the subscription
  cancelled_at: validationPatterns.optionalDate, // Timestamp when the subscription was cancelled
  contractor: validationPatterns.uuid, // The user (contractor) this subscription belongs to
  end_date: validationPatterns.date, // The date the subscription ends or expires
  features_unlocked: validationPatterns.nonEmptyString, // Text summary of features granted by this plan
  is_active: validationPatterns.yesNo, // Indicates whether the subscription is currently active
  is_auto_renew: validationPatterns.yesNo, // Indicates whether the subscription will auto-renew at the end of the current term
  payment_transaction: validationPatterns.uuid.optional(), // The linked payment that funded this subscription
  plan_name: validationPatterns.nonEmptyString, // Internal or public-facing name of the plan (e.g., 'Pro Tier', 'Basic')
  start_date: validationPatterns.date, // Date the subscription began
  tier_level: commonEnums.tierLevel, // Defines the access tier level granted by the plan
  stripe_subscription_id: validationPatterns.optionalString, // Stripe subscription ID for external linking
  amount: z.number().int().positive().optional(), // Payment amount in cents for this subscription
})

export type Subscription = z.infer<typeof subscriptionSchema>
