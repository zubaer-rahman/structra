import { z } from "zod";
import { commonFields, validationPatterns } from "./base";

export const signatureTypeSchema = z.enum(['handwritten', 'typed', 'uploaded']);
export const signatureStatusSchema = z.enum(['pending', 'signed', 'verified', 'rejected', 'expired']);

export const signatureSchema = z.object({
  ...commonFields,

  // Signature data
  signature_data: validationPatterns.nonEmptyString,
  signature_type: signatureTypeSchema.default('handwritten'),

  // User and document relationships
  user_id: validationPatterns.uuid,
  document_id: validationPatterns.uuid.optional(),
  document_type: z.string().optional(),

  // Signature metadata
  signer_name: validationPatterns.nonEmptyString,
  signer_email: z.string().email().optional(),
  signer_role: z.string().optional(),

  // Verification and security
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  signature_hash: z.string().optional(),
  is_verified: z.boolean().default(false),
  verified_at: z.date().optional(),

  // Status tracking
  status: signatureStatusSchema.default('pending'),
  expires_at: z.date().optional(),

  // Additional metadata
  metadata: z.record(z.string(), z.any()).default({}),
});

export const signatureAuditLogSchema = z.object({
  id: validationPatterns.uuid,
  created_at: z.date(),
  
  signature_id: validationPatterns.uuid,
  action: z.string(),
  actor_id: validationPatterns.uuid.optional(),
  actor_role: z.string().optional(),
  
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  
  previous_values: z.record(z.string(), z.any()).optional(),
  new_values: z.record(z.string(), z.any()).optional(),
});

export type Signature = z.infer<typeof signatureSchema>;
export type SignatureType = z.infer<typeof signatureTypeSchema>;
export type SignatureStatus = z.infer<typeof signatureStatusSchema>;
export type SignatureAuditLog = z.infer<typeof signatureAuditLogSchema>;

// Extended signature type with joins
export interface SignatureWithUser extends Signature {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface SignatureWithDocument extends Signature {
  document?: {
    id: string;
    type: string;
    title?: string;
  };
}

// Signature creation input
export const createSignatureInputSchema = z.object({
  signature_data: validationPatterns.nonEmptyString,
  signature_type: signatureTypeSchema.default('handwritten'),
  document_id: validationPatterns.uuid.optional(),
  document_type: z.string().optional(),
  signer_name: validationPatterns.nonEmptyString,
  signer_email: z.string().email().optional(),
  signer_role: z.string().optional(),
  expires_at: z.date().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
});

export type CreateSignatureInput = z.infer<typeof createSignatureInputSchema>;

// Signature update input
export const updateSignatureInputSchema = z.object({
  status: signatureStatusSchema.optional(),
  is_verified: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type UpdateSignatureInput = z.infer<typeof updateSignatureInputSchema>;

// Signature verification input
export const verifySignatureInputSchema = z.object({
  signature_id: validationPatterns.uuid,
  verification_code: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export type VerifySignatureInput = z.infer<typeof verifySignatureInputSchema>;
