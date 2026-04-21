// Form-specific visibility settings - limited to only Private and Public To Marketplace
export const FORM_VISIBILITY_SETTINGS = {
  PRIVATE: 'Private',
  PUBLIC_TO_MARKETPLACE: 'Public To Marketplace'
} as const;

export type FormVisibilitySettings = typeof FORM_VISIBILITY_SETTINGS[keyof typeof FORM_VISIBILITY_SETTINGS];

export const FORM_VISIBILITY_SETTINGS_VALUES = Object.values(FORM_VISIBILITY_SETTINGS);

// Form visibility settings descriptions
export const FORM_VISIBILITY_SETTINGS_DESCRIPTIONS: Record<FormVisibilitySettings, string> = {
  [FORM_VISIBILITY_SETTINGS.PRIVATE]: 'Visible only to the creator and assigned platform admins.',
  [FORM_VISIBILITY_SETTINGS.PUBLIC_TO_MARKETPLACE]: 'Visible to all eligible users browsing the marketplace.'
};
