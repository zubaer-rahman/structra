export const TIER_LEVELS = {
  FREE: 'free',
  VERIFIED: 'verified',
  PREMIUM: 'premium',
  ADMIN_TEST: 'admin_test',
  SUSPENDED: 'suspended'
} as const;

export type TierLevel = typeof TIER_LEVELS[keyof typeof TIER_LEVELS];

export const TIER_LEVEL_VALUES = Object.values(TIER_LEVELS);

// Tier level descriptions for better context
export const TIER_LEVEL_DESCRIPTIONS: Record<TierLevel, string> = {
  [TIER_LEVELS.FREE]: 'Basic tier with limited access to platform features.',
  [TIER_LEVELS.VERIFIED]: 'Contractor has paid the verification fee and received a verified badge, enabling proposal submissions and project views.',
  [TIER_LEVELS.PREMIUM]: 'Highest tier offering maximum benefits, such as unlimited views, placement boosts, and advanced features.',
  [TIER_LEVELS.ADMIN_TEST]: 'Temporary tier used for QA, staging, or admin overrides.',
  [TIER_LEVELS.SUSPENDED]: 'Contractor account has been restricted from submitting proposals or viewing projects due to billing, conduct, or compliance issues.'
};
