export const REJECTION_REASONS = {
  INCOMPLETE_PROPOSAL: 'incomplete_proposal',
  TOO_EXPENSIVE: 'too_expensive',
  TIMELINE_TOO_LONG: 'timeline_too_long',
  OUT_OF_SCOPE_ITEMS: 'out_of_scope_items',
  OTHER: 'other'
} as const;

export type RejectionReason = typeof REJECTION_REASONS[keyof typeof REJECTION_REASONS];

export const REJECTION_REASON_VALUES = Object.values(REJECTION_REASONS);

// Rejection reason descriptions for better context
export const REJECTION_REASON_DESCRIPTIONS: Record<RejectionReason, string> = {
  [REJECTION_REASONS.INCOMPLETE_PROPOSAL]: 'Missing required details, documents, or clarity.',
  [REJECTION_REASONS.TOO_EXPENSIVE]: 'Proposal pricing exceeded budget expectations.',
  [REJECTION_REASONS.TIMELINE_TOO_LONG]: 'Estimated project duration did not meet homeowner&apos;s timeline.',
  [REJECTION_REASONS.OUT_OF_SCOPE_ITEMS]: 'Proposal included tasks not aligned with the homeowner&apos;s request.',
  [REJECTION_REASONS.OTHER]: 'Reason did not fit any of the predefined categories.'
};
