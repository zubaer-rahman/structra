-- Migration 038: Complete Featured Projects and Contractors Implementation
-- This migration includes all necessary changes for the featured functionality

-- =============================================
-- 1. ADD NEW FIELDS TO TABLES
-- =============================================

-- Add is_featured_project field to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_featured_project BOOLEAN DEFAULT FALSE NOT NULL;

-- Add is_featured_contractor and featured_contractor_expiry fields to contractor_profiles table
ALTER TABLE contractor_profiles 
ADD COLUMN IF NOT EXISTS is_featured_contractor BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS featured_contractor_expiry TIMESTAMP WITH TIME ZONE;

-- =============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Create index for better performance on featured projects queries
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured_project) WHERE is_featured_project = TRUE;

-- Create index for better performance on featured contractor queries
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_featured ON contractor_profiles(is_featured_contractor) WHERE is_featured_contractor = TRUE;

-- Create index for featured contractor expiry queries
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_featured_expiry ON contractor_profiles(featured_contractor_expiry) WHERE is_featured_contractor = TRUE;

-- =============================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN projects.is_featured_project IS 'Indicates if this project is featured on the landing page (admin controlled)';
COMMENT ON COLUMN contractor_profiles.is_featured_contractor IS 'Indicates if this contractor is featured (admin controlled)';
COMMENT ON COLUMN contractor_profiles.featured_contractor_expiry IS 'Expiry date for featured contractor status - automatically sets is_featured_contractor to FALSE when passed';

-- =============================================
-- 4. CREATE CLEANUP FUNCTION
-- =============================================

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

-- =============================================
-- 5. CREATE TRIGGER FOR AUTOMATIC EXPIRY CHECK
-- =============================================

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
DROP TRIGGER IF EXISTS trigger_check_featured_contractor_expiry ON contractor_profiles;
CREATE TRIGGER trigger_check_featured_contractor_expiry
    BEFORE INSERT OR UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_featured_contractor_expiry();

-- =============================================
-- 6. ADD FUNCTION COMMENTS
-- =============================================

COMMENT ON FUNCTION update_expired_featured_contractors() IS 'Function to automatically set is_featured_contractor to FALSE for contractors whose featured_contractor_expiry has passed. Should be called by a cron job.';

-- =============================================
-- 7. SAMPLE DATA FOR TESTING (OPTIONAL)
-- =============================================

-- Uncomment the following lines to add sample featured data for testing
-- UPDATE projects SET is_featured_project = TRUE WHERE id IN (
--   SELECT id FROM projects WHERE status = 'Completed' LIMIT 3
-- );

-- UPDATE contractor_profiles SET 
--   is_featured_contractor = TRUE,
--   featured_contractor_expiry = NOW() + INTERVAL '30 days'
-- WHERE id IN (
--   SELECT id FROM contractor_profiles LIMIT 2
-- );
