import { z } from 'zod'
import { LEGAL_ENTITY_TYPE_VALUES } from '@/utils/constants/business'
import { USER_ROLE_VALUES } from '@/utils/constants/users'
import { TRADE_CATEGORY_VALUES } from '@/utils/constants/trades'
import { PROJECT_TYPE_VALUES, PROJECT_STATUS_VALUES } from '@/utils/constants/projects'
import { VISIBILITY_SETTINGS_VALUES } from '@/utils/constants/visibility'
import { ACCESS_METHOD_VALUES } from '@/utils/constants/access'
import { VIEW_STATUS_VALUES } from '@/utils/constants/views'
import { PROPOSAL_STATUS_VALUES } from '@/utils/constants/proposals'
import { REJECTION_REASON_VALUES } from '@/utils/constants/rejections'
import { AGREEMENT_STATUS_VALUES } from '@/utils/constants/agreements'
import { TIER_LEVEL_VALUES } from '@/utils/constants/tiers'

export const baseSchema = {
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
} as const

export const commonFields = {
  id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
} as const

export const commonEnums = {
  userRole: z.enum(USER_ROLE_VALUES),
  proposalStatus: z.enum(PROPOSAL_STATUS_VALUES),
  legalEntityType: z.enum(LEGAL_ENTITY_TYPE_VALUES),
  tradeCategory: z.enum(TRADE_CATEGORY_VALUES),
  projectType: z.enum(PROJECT_TYPE_VALUES),
  projectStatus: z.enum(PROJECT_STATUS_VALUES),
  rejectionReason: z.enum(REJECTION_REASON_VALUES),
  agreementStatus: z.enum(AGREEMENT_STATUS_VALUES),
  tierLevel: z.enum(TIER_LEVEL_VALUES),
  visibilitySettings: z.enum(VISIBILITY_SETTINGS_VALUES),
  accessMethod: z.enum(ACCESS_METHOD_VALUES),
  viewStatus: z.enum(VIEW_STATUS_VALUES),
} as const

export const validationPatterns = {
  email: z.string().email(),
  uuid: z.string().uuid(),
  positiveNumber: z.number().positive(),
  positiveInteger: z.number().int().positive(),
  url: z.string().url(),
  nonEmptyString: z.string().min(1),
  optionalString: z.string().optional(),
  optionalBoolean: z.boolean().optional(),
  optionalDate: z.date().optional(),
  optionalNumber: z.number().optional(),
  optionalUrl: z.string().url().optional(),
  // New patterns for geospatial and file handling
  geospatialLocation: z.object({
    address: z.string().min(1, 'Location address is required'),
    latitude: z.number().min(-90).max(90, 'Valid latitude coordinates are required'),
    longitude: z.number().min(-180).max(180, 'Valid longitude coordinates are required'),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  }),
  fileReference: z.object({
    id: z.string().uuid(),
    filename: z.string().min(1),
    url: z.string().url(),
    size: z.number().positive().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  }),
  fileArray: z.array(z.string().url()).default([]), // For backward compatibility
  // New patterns for proposal fields
  yesNo: z.enum(['yes', 'no']),
  htmlContent: z.string().optional(),
  amount: z.number().positive(),
  date: z.date(),
} as const

export type BaseSchema = z.infer<typeof baseSchema>
export type CommonFields = z.infer<typeof commonFields>
export type GeospatialLocation = z.infer<typeof validationPatterns.geospatialLocation>
export type FileReference = z.infer<typeof validationPatterns.fileReference>
export type YesNo = z.infer<typeof validationPatterns.yesNo>
export type ProposalStatus = z.infer<typeof commonEnums.proposalStatus>
export type RejectionReason = z.infer<typeof commonEnums.rejectionReason>
export type AgreementStatus = z.infer<typeof commonEnums.agreementStatus>
export type TierLevel = z.infer<typeof commonEnums.tierLevel>
export type VisibilitySettings = z.infer<typeof commonEnums.visibilitySettings>
export type AccessMethod = z.infer<typeof commonEnums.accessMethod>
export type ViewStatus = z.infer<typeof commonEnums.viewStatus>
