-- Migration 051: Add consent fields to reviews table for before/after photo usage
-- This migration adds fields to track homeowner consent for including before/after photos in reviews

-- Add consent fields to reviews table
ALTER TABLE reviews 
ADD COLUMN homeowner_consent_for_photos BOOLEAN DEFAULT FALSE,
ADD COLUMN consent_given_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN consent_given_by UUID REFERENCES users(id);

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN reviews.homeowner_consent_for_photos IS 'Indicates whether the homeowner consented to include before/after photos in the review and on contractor profile';
COMMENT ON COLUMN reviews.consent_given_at IS 'Timestamp when the homeowner gave consent for photo usage';
COMMENT ON COLUMN reviews.consent_given_by IS 'User ID of the homeowner who gave consent (should match the project creator)';

-- Create index for consent queries
CREATE INDEX idx_reviews_consent ON reviews(homeowner_consent_for_photos);

-- Add constraint to ensure consent_given_by is set when consent is true
ALTER TABLE reviews 
ADD CONSTRAINT check_consent_fields 
CHECK (
  (homeowner_consent_for_photos = FALSE) OR 
  (homeowner_consent_for_photos = TRUE AND consent_given_at IS NOT NULL AND consent_given_by IS NOT NULL)
);
