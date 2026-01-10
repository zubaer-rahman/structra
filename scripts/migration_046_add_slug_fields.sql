-- Migration 046: Add slug fields for SEO-friendly URLs
-- This migration adds slug fields to projects and contractor_profiles tables
-- to enable SEO-friendly URLs like /project/kitchen-renovation-downtown-vancouver
-- and /profile/john-smith-contracting

-- Add slug field to projects table
ALTER TABLE projects 
ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Add slug field to contractor_profiles table  
ALTER TABLE contractor_profiles
ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Create indexes for better performance on slug lookups
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_contractor_profiles_slug ON contractor_profiles(slug);

-- Add comments to document the new columns
COMMENT ON COLUMN projects.slug IS 'SEO-friendly URL slug generated from project title, e.g., "kitchen-renovation-downtown-vancouver"';
COMMENT ON COLUMN contractor_profiles.slug IS 'SEO-friendly URL slug generated from contractor name, e.g., "john-smith-contracting"';
