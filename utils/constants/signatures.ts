export const SIGNATURE_TYPES = {
  HANDWRITTEN: 'handwritten',
  TYPED: 'typed',
  UPLOADED: 'uploaded'
} as const;

export type SignatureType = typeof SIGNATURE_TYPES[keyof typeof SIGNATURE_TYPES];

export const SIGNATURE_STATUSES = {
  PENDING: 'pending',
  SIGNED: 'signed',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
} as const;

export type SignatureStatus = typeof SIGNATURE_STATUSES[keyof typeof SIGNATURE_STATUSES];

export const SIGNATURE_STATUS_VALUES = Object.values(SIGNATURE_STATUSES);

// Signature status descriptions
export const SIGNATURE_STATUS_DESCRIPTIONS: Record<SignatureStatus, string> = {
  [SIGNATURE_STATUSES.PENDING]: 'Signature is pending and waiting to be completed',
  [SIGNATURE_STATUSES.SIGNED]: 'Signature has been completed and captured',
  [SIGNATURE_STATUSES.VERIFIED]: 'Signature has been verified and is legally binding',
  [SIGNATURE_STATUSES.REJECTED]: 'Signature was rejected or invalidated',
  [SIGNATURE_STATUSES.EXPIRED]: 'Signature request has expired'
};

// Signature roles
export const SIGNATURE_ROLES = {
  CONTRACTOR: 'contractor',
  HOMEOWNER: 'homeowner',
  ADMIN: 'admin',
  WITNESS: 'witness'
} as const;

export type SignatureRole = typeof SIGNATURE_ROLES[keyof typeof SIGNATURE_ROLES];

// Document types that can be signed
export const SIGNATURE_DOCUMENT_TYPES = {
  AGREEMENT: 'agreement',
  PROPOSAL: 'proposal',
  CONTRACT: 'contract',
  INVOICE: 'invoice',
  CHANGE_ORDER: 'change_order',
  COMPLETION_CERTIFICATE: 'completion_certificate'
} as const;

export type SignatureDocumentType = typeof SIGNATURE_DOCUMENT_TYPES[keyof typeof SIGNATURE_DOCUMENT_TYPES];

// Signature validation rules
export const SIGNATURE_VALIDATION = {
  MIN_SIGNATURE_SIZE: 100, // Minimum bytes for signature data
  MAX_SIGNATURE_SIZE: 1024 * 1024, // 1MB max signature size
  SIGNATURE_EXPIRY_DAYS: 30, // Signatures expire after 30 days
  VERIFICATION_CODE_LENGTH: 6,
  MAX_SIGNATURE_ATTEMPTS: 3
} as const;

// Signature canvas settings
export const SIGNATURE_CANVAS = {
  DEFAULT_WIDTH: 400,
  DEFAULT_HEIGHT: 200,
  PEN_COLOR: '#000000',
  BACKGROUND_COLOR: '#ffffff',
  LINE_WIDTH: 2,
  LINE_CAP: 'round' as const,
  LINE_JOIN: 'round' as const
} as const;

// Signature audit actions
export const SIGNATURE_AUDIT_ACTIONS = {
  CREATED: 'created',
  SIGNED: 'signed',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  MODIFIED: 'modified',
  DOWNLOADED: 'downloaded',
  VIEWED: 'viewed'
} as const;

export type SignatureAuditAction = typeof SIGNATURE_AUDIT_ACTIONS[keyof typeof SIGNATURE_AUDIT_ACTIONS];
