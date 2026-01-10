-- Migration 037: Add function to automatically clean up expired featured contractors
-- This function will be called by a cron job to automatically set is_featured_contractor to FALSE when expiry date passes

-- Create function to update expired featured contractors
CREATE OR REPLACE FUNCTION update_expired_featured_contractors()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update contractors where featured_contractor_expiry has passed
    UPDATE contractor_profiles 
    SET is_featured_contractor = FALSE,
        updated_at = NOW()
    WHERE is_featured_contractor = TRUE 
      AND featured_contractor_expiry IS NOT NULL 
      AND featured_contractor_expiry < NOW();
    
    -- Get count of updated records
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the update (optional - you might want to add a logging table)
    RAISE NOTICE 'Updated % expired featured contractors', updated_count;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update is_featured_contractor when featured_contractor_expiry is set
CREATE OR REPLACE FUNCTION check_featured_contractor_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- If featured_contractor_expiry is set and in the past, set is_featured_contractor to FALSE
    IF NEW.featured_contractor_expiry IS NOT NULL AND NEW.featured_contractor_expiry < NOW() THEN
        NEW.is_featured_contractor := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE operations
CREATE TRIGGER trigger_check_featured_contractor_expiry
    BEFORE INSERT OR UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_featured_contractor_expiry();

-- Add comment for documentation
COMMENT ON FUNCTION update_expired_featured_contractors() IS 'Function to automatically set is_featured_contractor to FALSE for contractors whose featured_contractor_expiry has passed. Should be called by a cron job.';
