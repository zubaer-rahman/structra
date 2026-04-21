 
import { LegalEntityType, UserRole, TradeCategory } from '@/utils/constants'
import { FileReference } from './common'

export interface User {
  id: string
  email: string
  user_role: UserRole
  full_name: string
  first_name: string
  last_name: string
  phone_number?: string
  address?: string
  profile_photo?: string
  is_active: boolean
  is_verified_email: boolean
  is_verified_contractor: boolean
  is_verified_homeowner: boolean
  is_verified_phone: boolean
  user_agreed_to_terms: boolean
  last_login?: string
  contractor_profile?: string // Foreign key reference to contractor_profiles.id
  created_at: string
  updated_at: string
}

export interface ContractorProfile {
  id: string
  bio?: string // short biography or description of contractor's experience
  business_name: string // legal or trade business name of the contractor
  contractor_contacts: string[] // list of linked internal contacts for the contractor
  gst_hst_number?: string // CRA ID used for compliance verification
  insurance_builders_risk?: number // monetary amount of the builder's risk insurance
  insurance_expiry?: string // expiry date of the insurance
  insurance_general_liability?: number // monetary amount of the general liability insurance
  insurance_upload?: string // file representing proof of insurance
  is_insurance_verified: boolean // indicates whether the insurance status has been verified
  legal_entity_type?: LegalEntityType // corporate structure
  licenses: string[] // list of uploaded license files (legacy URLs)
  license_file?: FileReference[] // array of file references for license files
  logo?: string // company's logo file
  phone_number?: string // primary business phone number
  portfolio: string[] // list of past project images or documents (legacy URLs)
  portfolio_file?: FileReference[] // array of file references for portfolio files
  service_location?: string // central service location
  trade_category: TradeCategory[] // list specifying primary and secondary trades
  user_id: string // linked user account
  wcb_number?: string // Workers' Compensation Board number
  work_guarantee?: number // work and materials guarantee in months
  work_guarantee_statement?: string // text statement describing the work guarantee
  address?: {
    address: string
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    country?: string | null
  } // contractor's business address with geospatial data
  is_featured_contractor: boolean // indicates whether contractor is featured
  featured_contractor_expiry?: string // date when featured status expires
  gst_hst_clearance_document?: FileReference // GST/HST clearance document uploaded by admin
  wcb_clearance_document?: FileReference // WCB clearance document uploaded by admin
  insurance_certificate?: FileReference // Insurance certificate uploaded by admin after verification
  company_logo_image?: FileReference // company logo file reference
  is_admin_verified: boolean // indicates whether contractor has been verified by admin
  admin_verification_date?: string // date when admin verification was completed
  slug?: string // SEO-friendly URL slug
  created_at: string
  updated_at: string
}
