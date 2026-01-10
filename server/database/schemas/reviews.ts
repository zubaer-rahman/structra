import { z } from 'zod'
import { baseSchema, validationPatterns } from './base'

export const reviewSchema = z.object({
  ...baseSchema,
  
  // Core review fields
  author: validationPatterns.uuid, // The user who wrote and submitted the review
  file: z.array(validationPatterns.fileReference).default([]), // Optional supporting files or images uploaded with the review
  flagged: validationPatterns.yesNo, // Indicates whether the review has been flagged for moderation
  is_verified: validationPatterns.yesNo, // Indicates whether the platform has verified the author as part of the reviewed project
  project: validationPatterns.uuid, // The related project associated with this review
  rating: z.number().min(1).max(5), // The numeric rating score (typically 1–5 stars)
  recipient: validationPatterns.uuid, // The user who received the review (e.g., contractor or homeowner)
  recommend_score: z.number().min(0).max(10), // A Net Promoter Score-style metric (e.g., 0–10 likelihood of recommending)
  text: validationPatterns.nonEmptyString, // The written feedback included in the review
  
  // Consent fields for before/after photo usage
  homeowner_consent_for_photos: z.boolean().default(false), // Whether homeowner consented to include before/after photos in review
  consent_given_at: z.date().optional(), // When consent was given
  consent_given_by: validationPatterns.uuid.optional(), // Who gave the consent (homeowner)
})

export type Review = z.infer<typeof reviewSchema>
