-- Migration 045: Add company logo image column for contractor profiles
-- This migration adds a new column to store company logo as FileReference JSONB

-- Add company_logo_image column to store file reference for company logo
ALTER TABLE contractor_profiles 
ADD COLUMN company_logo_image JSONB;

-- Add comment to document the new column
COMMENT ON COLUMN contractor_profiles.company_logo_image IS 'File reference for company logo. Structure: {id: string, filename: string, url: string, size?: number, mimeType?: string, uploadedAt?: Date}';

-- Create index for better query performance
CREATE INDEX idx_contractor_profiles_company_logo_image ON contractor_profiles USING GIN (company_logo_image);
