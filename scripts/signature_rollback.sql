-- Signature System Rollback SQL
-- Run this script to remove the signature system from your database

-- Drop triggers and functions first
DROP TRIGGER IF EXISTS signatures_audit_trigger ON public.signatures;
DROP FUNCTION IF EXISTS trigger_log_signature_changes();
DROP FUNCTION IF EXISTS log_signature_event(UUID, TEXT, UUID, TEXT, INET, TEXT, JSONB, JSONB, JSONB);
DROP FUNCTION IF EXISTS generate_signature_hash(TEXT);

-- Remove signature fields from agreements table
ALTER TABLE public.agreements 
DROP COLUMN IF EXISTS homeowner_signature_id,
DROP COLUMN IF EXISTS contractor_signature_id,
DROP COLUMN IF EXISTS signature_deadline,
DROP COLUMN IF EXISTS signature_reminder_sent_at,
DROP COLUMN IF EXISTS fully_signed_at;

-- Drop tables (in reverse order due to foreign key constraints)
DROP TABLE IF EXISTS public.signature_audit_logs;
DROP TABLE IF EXISTS public.signatures;

-- Verify the rollback
SELECT 'Rollback completed successfully!' as status;
SELECT COUNT(*) as signatures_table_removed FROM information_schema.tables WHERE table_name = 'signatures';
SELECT COUNT(*) as audit_logs_table_removed FROM information_schema.tables WHERE table_name = 'signature_audit_logs';
