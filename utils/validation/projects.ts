import { z } from 'zod'
import { 
  projectTypeEnum, 
  tradeCategoryEnum
} from '@/server/database/schemas/projects'

// Create Project Form Schema - Essential fields only for initial project creation
export const createProjectFormSchema = z.object({
  // Core required fields for project creation
  project_title: z.string().min(1, 'Project title is required'),
  statement_of_work: z.string().min(1, 'Statement of work is required'),
  budget: z.number().positive('Budget must be a positive number'),
  category: z.array(tradeCategoryEnum).min(1, 'At least one category is required'),
  pid: z.string()
    .min(1, 'Parcel Identifier is required')
    .regex(/^\d{9}$/, 'Parcel Identifier must be exactly 9 digits'),
  location: z.object({
    address: z.string().min(1, 'Location address is required'),
    latitude: z.number().min(-90).max(90, 'Valid latitude coordinates are required'),
    longitude: z.number().min(-180).max(180, 'Valid longitude coordinates are required'),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
  }),
  project_type: projectTypeEnum,
  start_date: z.string().min(1, 'Start date is required').transform(str => new Date(str)),
  end_date: z.string().min(1, 'End date is required').transform(str => new Date(str)),
  expiry_date: z.string().min(1, 'Expiry date is required').transform(str => new Date(str)),
  project_photos: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string().min(1),
    url: z.string().url(),
    size: z.number().positive().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  })).default([]),
  // Optional fields (can be added later)
  substantial_completion: z.string().optional().refine(
    (date) => {
      if (!date) return true; // Optional field
      const completionDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return completionDate <= today;
    },
    { message: 'Substantial completion date cannot be in the future' }
  ).transform(str => str ? new Date(str) : undefined),
  delay_penalty: z.number().min(0, 'Delay penalty must be a positive number').default(0),
  abandonment_penalty: z.number().min(0, 'Abandonment penalty must be a positive number').default(0),
  files: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string().min(1),
    url: z.string().url(),
    size: z.number().positive().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  })).default([]),
  // Form-only fields (not stored in database)
  decision_date: z.string().min(1, 'Decision date is required').transform(str => new Date(str)),
  permit_required: z.boolean().default(false),
  // creator will be set automatically from user context
})

// Form input type (before transformation) - Essential fields only
export const createProjectFormInputSchema = z.object({
  // Core required fields
  project_title: z.string().min(1, 'Project title is required'),
  statement_of_work: z.string().min(1, 'Statement of work is required'),
  budget: z.number().positive('Budget must be a positive number'),
  category: z.array(tradeCategoryEnum).min(1, 'At least one category is required'),
  pid: z.string()
    .min(1, 'Parcel Identifier is required')
    .regex(/^\d{9}$/, 'Parcel Identifier must be exactly 9 digits'),
  location: z.object({
    address: z.string().min(1, 'Location address is required'),
    latitude: z.number().min(-90).max(90, 'Valid latitude coordinates are required'),
    longitude: z.number().min(-180).max(180, 'Valid longitude coordinates are required'),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
  }),
  project_type: projectTypeEnum,
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  project_photos: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string().min(1),
    url: z.string().url(),
    size: z.number().positive().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  })).min(1, 'At least one project photo is required'),
  // Optional fields
  substantial_completion: z.string().optional(),
  files: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string().min(1),
    url: z.string().url(),
    size: z.number().positive().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  })).default([]),
  // Form-only fields (not stored in database)
  decision_date: z.string().min(1, 'Decision date is required'),
  permit_required: z.boolean().default(false),
  delay_penalty: z.number().min(0, 'Delay penalty must be a positive number'),
  abandonment_penalty: z.number().min(0, 'Abandonment penalty must be a positive number'),
})

export type CreateProjectFormData = z.infer<typeof createProjectFormSchema>
export type CreateProjectFormInputData = z.infer<typeof createProjectFormInputSchema>
export type ProjectLocation = z.infer<typeof createProjectFormInputSchema>['location']
export type ProjectFile = z.infer<typeof createProjectFormInputSchema>['project_photos'][0]

// Edit Project Form Schema - All fields optional for flexible editing
export const editProjectFormInputSchema = z.object({
  // All fields are optional for editing - no validation constraints
  project_title: z.string().optional(),
  statement_of_work: z.string().optional(),
  budget: z.number().optional(),
  category: z.array(z.string()).optional(),
  pid: z.string()
    .regex(/^\d{9}$/, 'Parcel Identifier must be exactly 9 digits')
    .optional(),
  location: z.object({
    address: z.string().optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
  }).optional(),
  project_type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  expiry_date: z.string().optional(),
  project_photos: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string(),
    url: z.string().url(),
    size: z.number().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  })).optional(),
  certificate_of_title: z.string().optional(),
  substantial_completion: z.string().optional(),
  files: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string(),
    url: z.string().url(),
    size: z.number().optional(),
    mimeType: z.string().optional(),
    uploadedAt: z.date().optional(),
  })).optional(),
  decision_date: z.string().optional(),
  permit_required: z.boolean().optional(),
  delay_penalty: z.number().min(0).optional(),
  abandonment_penalty: z.number().min(0).optional(),
})

export type EditProjectFormInputData = z.infer<typeof editProjectFormInputSchema>
