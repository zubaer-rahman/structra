import { z } from "zod";
import { baseSchema, commonEnums, validationPatterns } from "./base";

export const contractorProfileSchema = z.object({
  ...baseSchema,
  bio: validationPatterns.optionalString,
  business_name: validationPatterns.nonEmptyString,
  contractor_contacts: z.array(validationPatterns.uuid).default([]),
  gst_hst_number: validationPatterns.optionalString,
  insurance_builders_risk: validationPatterns.optionalNumber,
  insurance_expiry: validationPatterns.optionalDate,
  insurance_general_liability: validationPatterns.optionalNumber,
  insurance_upload: validationPatterns.optionalUrl,
  is_insurance_verified: z.boolean().default(false),
  legal_entity_type: commonEnums.legalEntityType,
  licenses: z.array(validationPatterns.url).default([]),
  license_file: z.array(validationPatterns.fileReference).optional(),
  logo: validationPatterns.optionalUrl,
  phone_number: validationPatterns.optionalString,
  portfolio: z.array(validationPatterns.url).default([]),
  portfolio_file: z.array(validationPatterns.fileReference).optional(),
  service_location: validationPatterns.optionalString,
  trade_category: z.array(validationPatterns.nonEmptyString).default([]),
  user_id: validationPatterns.uuid,
  wcb_number: validationPatterns.optionalString,
  work_guarantee: validationPatterns.optionalNumber,
  work_guarantee_statement: validationPatterns.optionalString,
  address: validationPatterns.geospatialLocation.optional(),
  is_featured_contractor: z.boolean().default(false),
  featured_contractor_expiry: validationPatterns.optionalDate,
  gst_hst_clearance_document: validationPatterns.fileReference.optional(),
  wcb_clearance_document: validationPatterns.fileReference.optional(),
  insurance_certificate: validationPatterns.fileReference.optional(),
  company_logo_image: validationPatterns.fileReference.optional(),
  is_admin_verified: z.boolean().default(false),
  admin_verification_date: validationPatterns.optionalDate,
  slug: z.string().min(1).max(255).optional(),
});

export const contractorProfileCreateSchema = contractorProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const contractorProfileUpdateSchema = contractorProfileSchema
  .partial()
  .omit({
    id: true,
    createdAt: true,
  });

export const contractorVerificationSchema = z.object({
  contractor_id: validationPatterns.uuid,
  verification_type: z.enum(["insurance", "license", "business", "identity"]),
  verification_data: z.record(z.string(), z.unknown()),
  verified_by: validationPatterns.uuid,
  verification_notes: validationPatterns.optionalString,
});

export const contractorSearchSchema = z.object({
  trade_category: z.array(validationPatterns.nonEmptyString).optional(),
  service_location: validationPatterns.optionalString,
  is_insurance_verified: z.boolean().optional(),
  min_work_guarantee: validationPatterns.optionalNumber,
  has_portfolio: z.boolean().optional(),
  rating_min: z.number().int().min(1).max(5).optional(),
});

export const contractorAvailabilitySchema = z.object({
  contractor_id: validationPatterns.uuid,
  available_from: z.date(),
  available_until: validationPatterns.optionalDate,
  max_projects: validationPatterns.positiveInteger.optional(),
  preferred_project_types: z
    .array(validationPatterns.nonEmptyString)
    .optional(),
  unavailable_dates: z.array(z.date()).default([]),
});

export type ContractorProfile = z.infer<typeof contractorProfileSchema>;
export type ContractorProfileCreate = z.infer<
  typeof contractorProfileCreateSchema
>;
export type ContractorProfileUpdate = z.infer<
  typeof contractorProfileUpdateSchema
>;
export type ContractorVerification = z.infer<
  typeof contractorVerificationSchema
>;
export type ContractorSearch = z.infer<typeof contractorSearchSchema>;
export type ContractorAvailability = z.infer<
  typeof contractorAvailabilitySchema
>;

export const validateContractorProfile = (data: unknown): ContractorProfile =>
  contractorProfileSchema.parse(data);
export const validateContractorProfileCreate = (
  data: unknown
): ContractorProfileCreate => contractorProfileCreateSchema.parse(data);
export const validateContractorProfileUpdate = (
  data: unknown
): ContractorProfileUpdate => contractorProfileUpdateSchema.parse(data);
export const validateContractorSearch = (data: unknown): ContractorSearch =>
  contractorSearchSchema.parse(data);
export const validateContractorAvailability = (
  data: unknown
): ContractorAvailability => contractorAvailabilitySchema.parse(data);
