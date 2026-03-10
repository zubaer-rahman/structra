-- Add INSERT policy for signature_audit_logs to allow triggers to work
DROP POLICY IF EXISTS "System can insert signature audit logs" ON public.signature_audit_logs;
CREATE POLICY "System can insert signature audit logs"
ON public.signature_audit_logs FOR INSERT
WITH CHECK (true); -- We trust the trigger to set correct values, or we can restrict it more
