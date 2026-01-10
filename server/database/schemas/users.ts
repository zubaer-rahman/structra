import { z } from 'zod'
import { commonFields, commonEnums, validationPatterns } from './base'

export const userSchema = z.object({
  ...commonFields,
  email: validationPatterns.email,
  user_role: commonEnums.userRole,
  full_name: validationPatterns.nonEmptyString,
  first_name: validationPatterns.nonEmptyString,
  last_name: validationPatterns.nonEmptyString,
  phone_number: validationPatterns.optionalString,
  address: validationPatterns.optionalString,
  profile_photo: validationPatterns.optionalUrl,
  government_id: validationPatterns.fileReference.optional().nullable(),
  government_id_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_verified_email: z.boolean().default(false),
  is_verified_contractor: z.boolean().default(false),
  is_verified_homeowner: z.boolean().default(false),
  is_verified_phone: z.boolean().default(false),
  user_agreed_to_terms: z.boolean().default(false),
  has_paid_demo: z.boolean().default(false),
  last_login: validationPatterns.optionalDate,
  contractor_profile: validationPatterns.optionalString,
})

export const userUpdateSchema = userSchema.partial().omit({ 
  id: true, 
  created_at: true 
})

export const userCreateSchema = userSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
})

export const userVerificationSchema = z.object({
  email: validationPatterns.email,
  verificationCode: z.string().min(6).max(6),
})

export const userLoginSchema = z.object({
  email: validationPatterns.email,
  password: z.string().min(8),
})

export const userRegistrationSchema = z.object({
  email: validationPatterns.email,
  password: z.string().min(8),
  full_name: validationPatterns.nonEmptyString,
  first_name: validationPatterns.nonEmptyString,
  last_name: validationPatterns.nonEmptyString,
  user_role: commonEnums.userRole,
  user_agreed_to_terms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
})

export const passwordResetSchema = z.object({
  email: validationPatterns.email,
})

export const passwordResetConfirmSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
})

export type User = z.infer<typeof userSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type UserCreate = z.infer<typeof userCreateSchema>
export type UserVerification = z.infer<typeof userVerificationSchema>
export type UserLogin = z.infer<typeof userLoginSchema>
export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type PasswordReset = z.infer<typeof passwordResetSchema>
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>

export const validateUser = (data: unknown): User => userSchema.parse(data)
export const validateUserUpdate = (data: unknown): UserUpdate => userUpdateSchema.parse(data)
export const validateUserCreate = (data: unknown): UserCreate => userCreateSchema.parse(data)
export const validateUserLogin = (data: unknown): UserLogin => userLoginSchema.parse(data)
export const validateUserRegistration = (data: unknown): UserRegistration => userRegistrationSchema.parse(data)
