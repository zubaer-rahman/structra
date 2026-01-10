-- Migration 047: Add contract_reviewed column to proposals table
-- This column tracks whether the contractor has reviewed and confirmed the contract

-- Add the contract_reviewed column to proposals table
ALTER TABLE proposals 
ADD COLUMN contract_reviewed BOOLEAN DEFAULT FALSE;

-- Add a comment to document the column purpose
COMMENT ON COLUMN proposals.contract_reviewed IS 'Indicates whether the contractor has reviewed and confirmed the contract terms';

-- Update existing records to have contract_reviewed = false by default
UPDATE proposals 
SET contract_reviewed = FALSE 
WHERE contract_reviewed IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE proposals 
ALTER COLUMN contract_reviewed SET NOT NULL;
