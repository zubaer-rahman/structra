export const ACCESS_METHODS = {
  MANUAL_PAYWALL: 'Manual Paywall',
  TIER_ACCESS: 'Tier Access',
  FREE_TRIAL: 'Free Trial',
  ADMIN_GRANT: 'Admin Grant',
  REFERRAL_UNLOCK: 'Referral Unlock',
  SYSTEM_TEST: 'System Test'
} as const;

export type AccessMethod = typeof ACCESS_METHODS[keyof typeof ACCESS_METHODS];

export const ACCESS_METHOD_VALUES = Object.values(ACCESS_METHODS);

// Access method descriptions for better context
export const ACCESS_METHOD_DESCRIPTIONS: Record<AccessMethod, string> = {
  [ACCESS_METHODS.MANUAL_PAYWALL]: 'Contractor manually paid to view the project.',
  [ACCESS_METHODS.TIER_ACCESS]: 'Contractor accessed via their current subscription tier.',
  [ACCESS_METHODS.FREE_TRIAL]: 'Contractor used a limited-time or one-time promotional free view.',
  [ACCESS_METHODS.ADMIN_GRANT]: 'Access was manually granted by an admin or support team.',
  [ACCESS_METHODS.REFERRAL_UNLOCK]: 'Access was earned through a referral or invite-based unlock.',
  [ACCESS_METHODS.SYSTEM_TEST]: 'Internal test view for QA or system validation purposes.'
};
