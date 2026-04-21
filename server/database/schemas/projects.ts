import { z } from 'zod'
import { baseSchema, validationPatterns, commonEnums } from './base'

// Use the centralized project type enum from base schema
export const projectTypeEnum = commonEnums.projectType

// Use the centralized project status enum from base schema
export const projectStatusEnum = commonEnums.projectStatus

// Use the centralized visibility settings enum from base schema
export const visibilitySettingsEnum = commonEnums.visibilitySettings

// Use the centralized trade category enum from base schema
export const tradeCategoryEnum = commonEnums.tradeCategory

// Site Amenities Schema - Similar to Airbnb's "What this place offers"
export const siteAmenitiesSchema = z.object({
  power: z.array(z.enum([
    'indoor_receptacle',
    '2_plus_indoor_receptacles', 
    'outdoor_receptacle',
    '2_plus_outdoor_receptacles',
    '20_amp_receptacle',
    '30_amp_receptacle',
    '50_amp_receptacle'
  ])).default([]),
  sanitation: z.array(z.enum([
    'flushing_toilets',
    'portable_toilets'
  ])).default([]),
  water: z.array(z.enum([
    'indoor_tap',
    'outdoor_tap'
  ])).default([]),
  parking: z.array(z.enum([
    '1_space',
    '2_spaces', 
    '3_spaces',
    '4_spaces',
    '5_plus_spaces'
  ])).default([]),
  comfort: z.array(z.enum([
    'indoor_break_area',
    'outdoor_sheltered_break_area',
    'designated_smoking_area',
    'wifi',
    'cell_reception',
    'fridge'
  ])).default([]),
  safety: z.array(z.enum([
    'first_aid_kit',
    'fire_extinguisher',
    'spill_kit'
  ])).default([]),
  security: z.array(z.enum([
    'key_to_be_provided',
    'homeowner_managed',
    'security_guards',
    'security_cameras'
  ])).default([]),
  logistics: z.array(z.enum([
    'trailer_storage',
    'materials_storage',
    'contractor_signage_allowed',
    'construction_waste_bin',
    'household_waste_bin',
    'restricted_materials_waste_bin'
  ])).default([])
})

export type SiteAmenities = z.infer<typeof siteAmenitiesSchema>

export const projectSchema = z.object({
  ...baseSchema,
  project_title: validationPatterns.nonEmptyString,
  statement_of_work: validationPatterns.nonEmptyString,
  budget: validationPatterns.positiveNumber,
  category: z.array(tradeCategoryEnum).default([]),
  pid: validationPatterns.nonEmptyString,
  location: validationPatterns.geospatialLocation,
  project_type: projectTypeEnum,
  status: projectStatusEnum.default('Open for Proposals'),
  visibility_settings: visibilitySettingsEnum.default('Public To Marketplace'),
  start_date: z.date(),
  end_date: z.date(),
  expiry_date: z.date(),
  // ✅ NEW WORKFLOW FIELDS
  decision_date: validationPatterns.optionalDate, // Required in workflow, but optional in schema for flexibility
  permit_required: z.boolean().default(false), // Optional permit toggle
  substantial_completion: validationPatterns.optionalDate, // Date when project is 98% complete
  is_verified_project: z.boolean().default(false),
  delay_penalty: z.number().min(0).default(0),
  abandonment_penalty: z.number().min(0).default(0),
  project_photos: z.array(validationPatterns.fileReference).default([]),
  files: z.array(validationPatterns.fileReference).default([]),
  // After photo field for project completion (before photo is taken from first project_photo)
  after_photo: validationPatterns.fileReference.optional(),
  creator: validationPatterns.uuid,
  proposal_count: z.number().int().min(0).default(0),
  is_featured_project: z.boolean().default(false),
  site_amenities: siteAmenitiesSchema.optional(),
  title_awarded: z.boolean().default(false),
  project_certificate: validationPatterns.fileReference.optional().nullable(),
  slug: z.string().min(1).max(255).optional(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectType = z.infer<typeof projectTypeEnum>
export type ProjectStatus = z.infer<typeof projectStatusEnum>
export type VisibilitySettings = z.infer<typeof visibilitySettingsEnum>
export type TradeCategory = z.infer<typeof tradeCategoryEnum>


export const validateProject = (data: unknown): Project => projectSchema.parse(data)
