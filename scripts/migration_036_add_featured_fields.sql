-- Migration 036: Add Featured Project and Featured Contractor fields
-- This migration adds fields to support featured projects and contractors on the landing page

-- Add is_featured_project field to projects table
ALTER TABLE projects 
ADD COLUMN is_featured_project BOOLEAN DEFAULT FALSE NOT NULL;

-- Add is_featured_contractor and featured_contractor_expiry fields to contractor_profiles table
ALTER TABLE contractor_profiles 
ADD COLUMN is_featured_contractor BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN featured_contractor_expiry TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on featured projects queries
CREATE INDEX idx_projects_featured ON projects(is_featured_project) WHERE is_featured_project = TRUE;

-- Create index for better performance on featured contractor queries
CREATE INDEX idx_contractor_profiles_featured ON contractor_profiles(is_featured_contractor) WHERE is_featured_contractor = TRUE;

-- Create index for featured contractor expiry queries
CREATE INDEX idx_contractor_profiles_featured_expiry ON contractor_profiles(featured_contractor_expiry) WHERE is_featured_contractor = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN projects.is_featured_project IS 'Indicates if this project is featured on the landing page (admin controlled)';
COMMENT ON COLUMN contractor_profiles.is_featured_contractor IS 'Indicates if this contractor is featured (admin controlled)';
COMMENT ON COLUMN contractor_profiles.featured_contractor_expiry IS 'Expiry date for featured contractor status - automatically sets is_featured_contractor to FALSE when passed';
