-- Temporarily disable the signature audit trigger to test deletion
-- This will help us determine if the trigger is causing the 409 error

-- Disable the trigger
DROP TRIGGER IF EXISTS signatures_audit_trigger ON public.signatures;

-- Test deletion (you can run this manually)
-- DELETE FROM public.signatures WHERE id = 'a83cd807-d7a6-44a4-a549-a3d6924d00bb';

-- Re-enable the trigger after testing (run this after confirming deletion works)
-- CREATE TRIGGER signatures_audit_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON public.signatures
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_log_signature_changes();

SELECT 'Trigger temporarily disabled for testing' as status;
