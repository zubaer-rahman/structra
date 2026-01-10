import { GeospatialLocation } from '@/server/database/schemas/base'

export interface ProjectWithProposal {
  id: string
  project_title: string
  statement_of_work: string
  category: string | string[]
  location: GeospatialLocation
  status: string
  budget: number | null
  created_at: string
  expiry_date: string | null
  start_date: string | null
  end_date: string | null
  slug: string
  homeowner?: {
    id: string
    full_name: string
    email: string
    phone_number?: string
    address?: string | null
  }
  proposal?: {
    id: string
    title: string
    status: string
    subtotal_amount: number | null
    total_amount: number | null
    created_at: string
    description_of_work: string
    proposed_start_date: string | null
    proposed_end_date: string | null
    contract_reviewed: boolean
    homeowner_contract_reviewed: boolean
    rejected_date?: string | null
    rejection_reason?: string | null
    rejection_reason_notes?: string | null
  } | null
}
