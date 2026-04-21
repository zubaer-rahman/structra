export const VISIBILITY_SETTINGS = {
  PRIVATE: 'Private',
  SHARED_WITH_TARGET_USER: 'Shared With Target User',
  SHARED_WITH_PARTICIPANT: 'Shared With Participant',
  PUBLIC_TO_INVITEES: 'Public To Invitees',
  PUBLIC_TO_MARKETPLACE: 'Public To Marketplace',
  ADMIN_ONLY: 'AdminOnly'
} as const;

export type VisibilitySettings = typeof VISIBILITY_SETTINGS[keyof typeof VISIBILITY_SETTINGS];

export const VISIBILITY_SETTINGS_VALUES = Object.values(VISIBILITY_SETTINGS);

// Visibility settings descriptions for better context
export const VISIBILITY_SETTINGS_DESCRIPTIONS: Record<VisibilitySettings, string> = {
  [VISIBILITY_SETTINGS.PRIVATE]: 'Visible only to the creator and assigned platform admins.',
  [VISIBILITY_SETTINGS.SHARED_WITH_TARGET_USER]: 'Visible to a specific intended recipient (e.g., contractor or homeowner).',
  [VISIBILITY_SETTINGS.SHARED_WITH_PARTICIPANT]: 'Visible to all users actively involved in the item or thread.',
  [VISIBILITY_SETTINGS.PUBLIC_TO_INVITEES]: 'Visible to all users invited to the project or opportunity.',
  [VISIBILITY_SETTINGS.PUBLIC_TO_MARKETPLACE]: 'Visible to all eligible users browsing the marketplace.',
  [VISIBILITY_SETTINGS.ADMIN_ONLY]: 'Visible only to platform administrators for moderation, legal, or internal purposes.'
};
