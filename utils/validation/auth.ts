import { z } from 'zod'
import { USER_ROLE_VALUES } from '@/utils/constants'

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Reset Password Schema
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// Registration Schema
export const registrationSchema = z.object({
  user_role: z.enum(USER_ROLE_VALUES),
  first_name: z.string()
    .min(2, 'First name needs at least 2 characters')
    .max(50, 'First name is too long (max 50 characters)')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  last_name: z.string()
    .min(2, 'Last name needs at least 2 characters')
    .max(50, 'Last name is too long (max 50 characters)')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long (max 255 characters)'),
  password: z.string()
    .min(8, 'Add at least 8 characters')
    .max(128, 'Password is too long (max 128 characters)')
    .regex(/^(?=.*[a-z])/, 'Add a lowercase letter (a-z)')
    .regex(/^(?=.*[A-Z])/, 'Add an uppercase letter (A-Z)')
    .regex(/^(?=.*\d)/, 'Add a number (0-9)')
    .regex(/^(?=.*[@$!%*?&])/, 'Add a special character (@$!%*?&)'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  user_agreed_to_terms: z.boolean().refine(val => val === true, 'Please agree to the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match. Please try again.",
  path: ["confirmPassword"],
})

// Async email validation schema (for real-time validation)
export const emailValidationSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long (max 255 characters)'),
})

export type RegistrationFormData = z.infer<typeof registrationSchema>
export type EmailValidationData = z.infer<typeof emailValidationSchema>
