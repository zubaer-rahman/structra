-- Migration 042: Add insurance certificate field to contractor_profiles table
-- This migration adds a field for admin-uploaded insurance certificate after verification

-- Add the new column to contractor_profiles table
ALTER TABLE contractor_profiles 
ADD COLUMN insurance_certificate JSONB;

-- Add comment to document the new field
COMMENT ON COLUMN contractor_profiles.insurance_certificate IS 'Insurance certificate file reference uploaded by admin after verification';

-- Create an index on the insurance certificate field for better query performance
CREATE INDEX idx_contractor_profiles_insurance_certificate ON contractor_profiles USING GIN (insurance_certificate);
