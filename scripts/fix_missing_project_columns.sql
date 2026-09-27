-- Fix missing columns on projects and proposals tables
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Add missing columns to the 'projects' table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS pid TEXT,
ADD COLUMN IF NOT EXISTS delay_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS abandonment_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS permit_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS decision_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_verified_project BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS site_amenities JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS certificate_of_title TEXT,
ADD COLUMN IF NOT EXISTS project_certificate JSONB,
ADD COLUMN IF NOT EXISTS proposal_count INTEGER DEFAULT 0;

-- 2. Add missing columns to the 'proposals' table
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS delay_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS abandonment_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS work_guarantee_statement TEXT;

-- 3. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
