export const VIEW_STATUSES = {
  VIEWED: 'Viewed',
  PREVIEW_ONLY: 'Preview Only',
  NOT_COMPLETED: 'Not Completed',
  BLOCKED: 'Blocked',
  EXPIRED: 'Expired'
} as const;

export type ViewStatus = typeof VIEW_STATUSES[keyof typeof VIEW_STATUSES];

export const VIEW_STATUS_VALUES = Object.values(VIEW_STATUSES);

// View status descriptions for better context
export const VIEW_STATUS_DESCRIPTIONS: Record<ViewStatus, string> = {
  [VIEW_STATUSES.VIEWED]: 'Contractor has successfully accessed and viewed the full project details.',
  [VIEW_STATUSES.PREVIEW_ONLY]: 'Contractor only saw a limited preview (e.g., project title or short excerpt) but did not unlock full access.',
  [VIEW_STATUSES.NOT_COMPLETED]: 'Contractor triggered access but did not complete the full view (e.g., left the page early or encountered an error).',
  [VIEW_STATUSES.BLOCKED]: 'Contractor was prevented from viewing the project due to access restrictions or administrative intervention.',
  [VIEW_STATUSES.EXPIRED]: 'Contractor\'s access window (e.g., 24 hours) has elapsed without a full view.'
};
