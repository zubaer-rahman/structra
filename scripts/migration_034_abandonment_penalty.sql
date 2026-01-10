-- Migration 034: Add abandonment_penalty column to projects and proposals tables
-- This migration adds the abandonment_penalty field which is automatically calculated as delay_penalty * 30

-- Add abandonment_penalty column to projects table
ALTER TABLE projects 
ADD COLUMN abandonment_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Add abandonment_penalty column to proposals table
ALTER TABLE proposals 
ADD COLUMN abandonment_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Update existing projects to calculate abandonment penalty from delay penalty
UPDATE projects 
SET abandonment_penalty = delay_penalty * 30 
WHERE delay_penalty > 0;

-- Update existing proposals to calculate abandonment penalty from delay penalty
UPDATE proposals 
SET abandonment_penalty = delay_penalty * 30 
WHERE delay_penalty > 0;

-- Add comments to document the new columns
COMMENT ON COLUMN projects.abandonment_penalty IS 'Penalty for abandoning the contract after signing but before start date. Auto-calculated as delay_penalty * 30 days.';
COMMENT ON COLUMN proposals.abandonment_penalty IS 'Penalty for abandoning the contract after signing but before start date. Auto-calculated as delay_penalty * 30 days.';

-- Verify the changes
SELECT 
  'projects' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'abandonment_penalty'

UNION ALL

SELECT 
  'proposals' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'proposals' AND column_name = 'abandonment_penalty';
