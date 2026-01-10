-- Cron Job Setup for Featured Contractor Cleanup
-- This file contains the setup for automatically cleaning up expired featured contractors

-- =============================================
-- 1. CREATE A LOGGING TABLE (OPTIONAL)
-- =============================================

-- Create a table to log cleanup operations
CREATE TABLE IF NOT EXISTS featured_cleanup_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cleanup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contractors_updated INTEGER NOT NULL,
    details TEXT
);

-- =============================================
-- 2. ENHANCED CLEANUP FUNCTION WITH LOGGING
-- =============================================

CREATE OR REPLACE FUNCTION update_expired_featured_contractors_with_logging()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
    cleanup_details TEXT;
BEGIN
    -- Get contractors that will be updated for logging
    SELECT COUNT(*) INTO updated_count
    FROM contractor_profiles 
    WHERE is_featured_contractor = TRUE 
      AND featured_contractor_expiry IS NOT NULL 
      AND featured_contractor_expiry < NOW();
    
    -- Update contractors where featured_contractor_expiry has passed
    UPDATE contractor_profiles 
    SET is_featured_contractor = FALSE,
        updated_at = NOW()
    WHERE is_featured_contractor = TRUE 
      AND featured_contractor_expiry IS NOT NULL 
      AND featured_contractor_expiry < NOW();
    
    -- Log the cleanup operation
    cleanup_details := 'Cleaned up ' || updated_count || ' expired featured contractors';
    
    INSERT INTO featured_cleanup_log (contractors_updated, details)
    VALUES (updated_count, cleanup_details);
    
    -- Log the update
    RAISE NOTICE 'Updated % expired featured contractors', updated_count;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. CRON JOB SETUP INSTRUCTIONS
-- =============================================

-- To set up the cron job, you can use pg_cron extension if available:
-- 
-- 1. Enable pg_cron extension (if not already enabled):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule the cleanup function to run daily at 2 AM:
--    SELECT cron.schedule('cleanup-expired-featured-contractors', '0 2 * * *', 'SELECT update_expired_featured_contractors_with_logging();');
--
-- 3. To view scheduled jobs:
--    SELECT * FROM cron.job;
--
-- 4. To remove the scheduled job:
--    SELECT cron.unschedule('cleanup-expired-featured-contractors');

-- =============================================
-- 4. MANUAL CLEANUP COMMANDS
-- =============================================

-- To manually run the cleanup:
-- SELECT update_expired_featured_contractors_with_logging();

-- To check current featured contractors and their expiry dates:
-- SELECT 
--   cp.user_id,
--   u.full_name,
--   cp.business_name,
--   cp.is_featured_contractor,
--   cp.featured_contractor_expiry,
--   CASE 
--     WHEN cp.featured_contractor_expiry IS NULL THEN 'No expiry set'
--     WHEN cp.featured_contractor_expiry < NOW() THEN 'EXPIRED'
--     ELSE 'Active'
--   END as status
-- FROM contractor_profiles cp
-- JOIN users u ON cp.user_id = u.id
-- WHERE cp.is_featured_contractor = TRUE
-- ORDER BY cp.featured_contractor_expiry DESC;

-- =============================================
-- 5. MONITORING QUERIES
-- =============================================

-- View cleanup log history:
-- SELECT * FROM featured_cleanup_log ORDER BY cleanup_date DESC LIMIT 10;

-- Count current featured contractors:
-- SELECT COUNT(*) as current_featured_contractors 
-- FROM contractor_profiles 
-- WHERE is_featured_contractor = TRUE;

-- Count current featured projects:
-- SELECT COUNT(*) as current_featured_projects 
-- FROM projects 
-- WHERE is_featured_project = TRUE;
