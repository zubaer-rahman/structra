export const LEGAL_ENTITY_TYPES = {
  SOLE_PROPRIETOR: 'Sole Proprietor',
  CORPORATION: 'Corporation',
  PARTNERSHIP: 'Partnership',
  NON_PROFIT: 'Non-Profit',
  OTHER: 'Other'
} as const;

export type LegalEntityType = typeof LEGAL_ENTITY_TYPES[keyof typeof LEGAL_ENTITY_TYPES];

export const LEGAL_ENTITY_TYPE_VALUES = Object.values(LEGAL_ENTITY_TYPES);
