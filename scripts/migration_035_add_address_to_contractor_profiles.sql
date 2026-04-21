-- Migration 035: Add address field to contractor_profiles table
-- This migration adds a JSONB address field to store geospatial location data
-- similar to the project location structure

-- Add the address column to contractor_profiles table
ALTER TABLE contractor_profiles 
ADD COLUMN address JSONB;

-- Add a comment to document the address field structure
COMMENT ON COLUMN contractor_profiles.address IS 'Contractor business address with geospatial data. Structure: {address: string, latitude?: number, longitude?: number, city?: string, province?: string, postalCode?: string, country?: string}';

-- Optional: Create an index on the address field for better query performance
-- This index will help with location-based searches
CREATE INDEX idx_contractor_profiles_address ON contractor_profiles USING GIN (address);

-- Optional: Create a partial index for contractors with valid address data
-- This can improve performance for location-based queries
CREATE INDEX idx_contractor_profiles_address_valid ON contractor_profiles USING GIN (address) 
WHERE address IS NOT NULL AND address->>'address' IS NOT NULL;
