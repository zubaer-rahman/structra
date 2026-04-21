export interface FileReference {
  id: string
  filename: string
  url: string
  size?: number
  mimeType?: string
  uploadedAt?: Date
}

export interface GeospatialLocation {
  address: string
  latitude: number
  longitude: number
  city: string
  province: string
  postalCode: string
  country?: string
}

// Re-export types from constants for convenience
export type { ProjectType, ProjectStatus, VisibilitySettings, AccessMethod, ViewStatus, ProposalStatus, RejectionReason, AgreementStatus, TierLevel } from '@/utils/constants'
export type { TradeCategory } from '@/utils/constants'
export type { UserRole } from '@/utils/constants'
export type { LegalEntityType } from '@/utils/constants'
