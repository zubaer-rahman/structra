-- Debug the signature audit system
-- Check if the log_signature_event function exists and works

-- Check if the function exists
SELECT 
  routine_name, 
  routine_type, 
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'log_signature_event' 
AND routine_schema = 'public';

-- Check if the audit logs table exists
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'signature_audit_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the function manually (this might fail, but will show the error)
-- SELECT log_signature_event(
--   'a83cd807-d7a6-44a4-a549-a3d6924d00bb'::uuid,
--   'DELETE',
--   'a83cd807-d7a6-44a4-a549-a3d6924d00bb'::uuid,
--   'contractor',
--   NULL::inet,
--   'test',
--   '{}'::jsonb,
--   '{"id": "a83cd807-d7a6-44a4-a549-a3d6924d00bb"}'::jsonb,
--   NULL::jsonb
-- );

-- Check current triggers on signatures table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'signatures' 
AND event_object_schema = 'public';
