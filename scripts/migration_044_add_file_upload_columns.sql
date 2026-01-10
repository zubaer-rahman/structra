-- Migration 044: Add file upload columns for portfolio and licenses
-- This migration adds new columns to store file references for portfolio and license files

-- Add portfolio_file column to store file references for portfolio
ALTER TABLE contractor_profiles 
ADD COLUMN portfolio_file JSONB;

-- Add license_file column to store file references for licenses  
ALTER TABLE contractor_profiles 
ADD COLUMN license_file JSONB;

-- Add comments to document the new columns
COMMENT ON COLUMN contractor_profiles.portfolio_file IS 'Array of file references for portfolio files. Structure: [{id: string, filename: string, url: string, size?: number, mimeType?: string, uploadedAt?: Date}]';
COMMENT ON COLUMN contractor_profiles.license_file IS 'Array of file references for license files. Structure: [{id: string, filename: string, url: string, size?: number, mimeType?: string, uploadedAt?: Date}]';

-- Create indexes for better query performance
CREATE INDEX idx_contractor_profiles_portfolio_file ON contractor_profiles USING GIN (portfolio_file);
CREATE INDEX idx_contractor_profiles_license_file ON contractor_profiles USING GIN (license_file);
