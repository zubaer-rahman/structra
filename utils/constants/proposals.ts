export const PROPOSAL_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired'
} as const;

export type ProposalStatus = typeof PROPOSAL_STATUSES[keyof typeof PROPOSAL_STATUSES];

export const PROPOSAL_STATUS_VALUES = Object.values(PROPOSAL_STATUSES);

// Proposal status descriptions for better context
export const PROPOSAL_STATUS_DESCRIPTIONS: Record<ProposalStatus, string> = {
  [PROPOSAL_STATUSES.DRAFT]: 'The proposal is currently being prepared by the contractor and is not yet visible to the homeowner.',
  [PROPOSAL_STATUSES.SUBMITTED]: 'The proposal has been officially sent to the homeowner for their review.',
  [PROPOSAL_STATUSES.VIEWED]: 'The homeowner has opened and viewed the proposal.',
  [PROPOSAL_STATUSES.ACCEPTED]: 'The homeowner has approved the proposal, indicating readiness to proceed with agreement generation.',
  [PROPOSAL_STATUSES.REJECTED]: 'The homeowner has declined the proposal.',
  [PROPOSAL_STATUSES.WITHDRAWN]: 'The contractor has retracted the proposal before it was either accepted or rejected by the homeowner.',
  [PROPOSAL_STATUSES.EXPIRED]: 'The proposal was not acted upon within a predefined time limit and is no longer active.'
};
