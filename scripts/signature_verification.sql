-- Signature System Verification SQL
-- Run this script to verify the signature system is properly installed

-- Check if tables exist
SELECT 
  'signatures' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signatures') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

SELECT 
  'signature_audit_logs' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signature_audit_logs') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if functions exist
SELECT 
  'generate_signature_hash' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_signature_hash') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

SELECT 
  'log_signature_event' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_signature_event') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if trigger exists
SELECT 
  'signatures_audit_trigger' as trigger_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'signatures_audit_trigger') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if indexes exist
SELECT 
  indexname as index_name,
  tablename as table_name
FROM pg_indexes 
WHERE tablename IN ('signatures', 'signature_audit_logs')
ORDER BY tablename, indexname;

-- Check if agreements table has signature columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'agreements' 
  AND column_name IN ('homeowner_signature_id', 'contractor_signature_id', 'signature_deadline', 'signature_reminder_sent_at', 'fully_signed_at')
ORDER BY column_name;

-- Test signature hash function
SELECT 
  'Test signature hash function' as test_name,
  CASE 
    WHEN length(generate_signature_hash('test data')) = 64 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;

-- Check table constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('signatures', 'signature_audit_logs')
ORDER BY tc.table_name, tc.constraint_type;

-- Summary
SELECT 
  'VERIFICATION COMPLETE' as status,
  'Check the results above to ensure all components are properly installed' as message;
