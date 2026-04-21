import {
  VisibilitySettings,
  ProposalStatus,
  RejectionReason,
} from "@/utils/constants";

// Base proposal interface (matches the comprehensive schema exactly)
export interface Proposal {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Core proposal fields
  title: string;
  description_of_work: string;

  // Project and user relationships (flat ID references)
  project: string;
  contractor: string;
  homeowner: string;

  // Financial fields
  subtotal_amount: number;
  tax_included: "yes" | "no";
  total_amount: number;
  deposit_amount: number;
  deposit_due_on: Date;
  delay_penalty: number;
  abandonment_penalty: number;

  // Timeline fields
  proposed_start_date: Date;
  proposed_end_date: Date;
  expiry_date: Date;

  // Status and workflow fields
  status: ProposalStatus;
  is_selected: "yes" | "no";
  is_deleted: "yes" | "no";
  contract_reviewed: boolean;
  homeowner_contract_reviewed: boolean;
  contract_reviewed_at?: Date;
  homeowner_contract_reviewed_at?: Date;

  // Dates and timestamps
  submitted_date?: Date;
  accepted_date?: Date;
  rejected_date?: Date;
  withdrawn_date?: Date;
  viewed_date?: Date;
  last_updated: Date;

  // Rejection handling
  rejected_by?: string;
  rejection_reason?: RejectionReason;
  rejection_reason_notes?: string;

  // Content and documentation
  clause_preview_html?: string;
  attached_files: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
  }>;
  notes?: string;
  work_guarantee_statement?: string;

  // Relationships and references
  agreement?: string;
  proposals: string[];

  // User tracking
  created_by: string;
  last_modified_by: string;

  // Visibility and sharing
  visibility_settings: VisibilitySettings;
}

// Additional proposal types from the schema
export interface ProposalCreate {
  title: string;
  description_of_work: string;
  project: string;
  contractor: string;
  homeowner: string;
  subtotal_amount: number;
  tax_included: "yes" | "no";
  total_amount: number;
  deposit_amount: number;
  deposit_due_on: Date;
  delay_penalty: number;
  abandonment_penalty: number;
  proposed_start_date: Date;
  proposed_end_date: Date;
  expiry_date: Date;
  clause_preview_html?: string;
  attached_files?: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
  }>;
  notes?: string;
  visibility_settings?: VisibilitySettings;
}

export interface ProposalUpdate {
  title?: string;
  description_of_work?: string;
  subtotal_amount?: number;
  tax_included?: "yes" | "no";
  total_amount?: number;
  deposit_amount?: number;
  deposit_due_on?: Date;
  delay_penalty?: number;
  abandonment_penalty?: number;
  proposed_start_date?: Date;
  proposed_end_date?: Date;
  expiry_date?: Date;
  status?: ProposalStatus;
  is_selected?: "yes" | "no";
  clause_preview_html?: string;
  attached_files?: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
  }>;
  notes?: string;
  visibility_settings?: VisibilitySettings;
}

export interface ProposalStatusUpdate {
  proposal_id: string;
  new_status: ProposalStatus;
  status_reason?: string;
  updated_by: string;
}

export interface ProposalResubmission {
  original_proposal_id: string;
  new_subtotal_amount: number;
  new_description_of_work: string;
  new_timeline: {
    proposed_start_date: Date;
    proposed_end_date: Date;
  };
  resubmission_reason?: string;
}

export interface ProposalSearch {
  project?: string;
  contractor?: string;
  homeowner?: string;
  status?: ProposalStatus;
  subtotal_amount_min?: number;
  subtotal_amount_max?: number;
  date_from?: Date;
  date_to?: Date;
  is_selected?: "yes" | "no";
}

export interface ProposalComparison {
  proposal_ids: string[];
  comparison_criteria: (
    | "price"
    | "timeline"
    | "experience"
    | "rating"
    | "availability"
  )[];
}

export interface ProposalFeedback {
  proposal_id: string;
  feedback_type: "acceptance" | "rejection" | "revision_request" | "question";
  feedback_message: string;
  feedback_by: string;
  feedback_date: Date;
}

export interface ProposalRevisionRequest {
  proposal_id: string;
  requested_changes: string[];
  revision_deadline: Date;
  revision_notes?: string;
  requested_by: string;
}

// Extended proposal type with joined data from Supabase queries
export interface ProposalWithJoins {
  tax_total?: number;
  id: string;
  project: string;
  project_id: string;
  contractor: string;
  homeowner: string;
  title: string;
  description_of_work: string;
  subtotal_amount: number;
  tax_included: "yes" | "no";
  total_amount: number;
  deposit_amount: number;
  deposit_due_on: string;
  delay_penalty: number;
  abandonment_penalty: number;
  proposed_start_date: string;
  proposed_end_date: string;
  expiry_date: string;
  status: string;
  is_selected: "yes" | "no";
  is_deleted: "yes" | "no";
  contract_reviewed: boolean;
  homeowner_contract_reviewed: boolean;
  contract_reviewed_at?: string;
  homeowner_contract_reviewed_at?: string;
  submitted_date?: string;
  accepted_date?: string;
  rejected_date?: string;
  withdrawn_date?: string;
  viewed_date?: string;
  last_updated: string;
  rejected_by?: string;
  rejection_reason?: string;
  rejection_reason_notes?: string;
  clause_preview_html?: string;
  attached_files?: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string;
  }>;
  notes?: string;
  work_guarantee_statement?: string;
  agreement?: string;
  proposals: string[];
  created_by: string;
  last_modified_by: string;
  visibility_settings: "private" | "public" | "shared";
  created_at: string;
  updated_at: string;
  project_details: {
    id: string;
    project_title: string;
    statement_of_work: string;
    category: string[];
    location: Record<string, unknown>;
    status: string;
    budget: number;
    pid?: string;
  };
  contractor_profile?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    address?: string;
  };
}
