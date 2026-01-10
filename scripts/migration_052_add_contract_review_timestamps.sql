-- Migration 052: Add timestamp fields for contract review tracking
-- This migration adds timestamp fields to track when contracts are reviewed and signed

-- Add contractor contract review timestamp
ALTER TABLE proposals 
ADD COLUMN contract_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add homeowner contract review timestamp  
ALTER TABLE proposals 
ADD COLUMN homeowner_contract_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add comments to document the column purposes
COMMENT ON COLUMN proposals.contract_reviewed_at IS 'Timestamp when the contractor reviewed and confirmed the contract terms';
COMMENT ON COLUMN proposals.homeowner_contract_reviewed_at IS 'Timestamp when the homeowner reviewed and confirmed the contract terms';

-- Create indexes for performance on these timestamp fields
CREATE INDEX idx_proposals_contract_reviewed_at ON proposals(contract_reviewed_at);
CREATE INDEX idx_proposals_homeowner_contract_reviewed_at ON proposals(homeowner_contract_reviewed_at);
