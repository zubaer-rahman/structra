-- Migration 048: Add homeowner_contract_reviewed column to proposals table
-- This column tracks whether the homeowner has reviewed and confirmed the contract

-- Add the homeowner_contract_reviewed column to proposals table
ALTER TABLE proposals 
ADD COLUMN homeowner_contract_reviewed BOOLEAN DEFAULT FALSE;

-- Add a comment to document the column purpose
COMMENT ON COLUMN proposals.homeowner_contract_reviewed IS 'Indicates whether the homeowner has reviewed and confirmed the contract terms';

-- Update existing records to have homeowner_contract_reviewed = false by default
UPDATE proposals 
SET homeowner_contract_reviewed = FALSE 
WHERE homeowner_contract_reviewed IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE proposals 
ALTER COLUMN homeowner_contract_reviewed SET NOT NULL;
