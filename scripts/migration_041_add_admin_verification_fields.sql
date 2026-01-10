-- Migration 041: Add admin verification fields to contractor_profiles table
-- This migration adds fields for admin-uploaded clearance documents and verification status

-- Add the new columns to contractor_profiles table
ALTER TABLE contractor_profiles 
ADD COLUMN gst_hst_clearance_document TEXT,
ADD COLUMN wcb_clearance_document TEXT,
ADD COLUMN is_admin_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_verification_date TIMESTAMP WITH TIME ZONE;

-- Add comments to document the new fields
COMMENT ON COLUMN contractor_profiles.gst_hst_clearance_document IS 'URL to GST/HST clearance document uploaded by admin';
COMMENT ON COLUMN contractor_profiles.wcb_clearance_document IS 'URL to WCB clearance document uploaded by admin';
COMMENT ON COLUMN contractor_profiles.is_admin_verified IS 'Indicates whether contractor has been verified by admin with clearance documents';
COMMENT ON COLUMN contractor_profiles.admin_verification_date IS 'Date when admin verification was completed';

-- Create an index on the admin verification status for better query performance
CREATE INDEX idx_contractor_profiles_admin_verified ON contractor_profiles (is_admin_verified);

-- Create a partial index for admin-verified contractors
CREATE INDEX idx_contractor_profiles_admin_verified_true ON contractor_profiles (admin_verification_date) 
WHERE is_admin_verified = TRUE;
