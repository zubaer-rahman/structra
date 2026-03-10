-- Enable RLS on signatures table
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own signatures
DROP POLICY IF EXISTS "Users can view their own signatures" ON public.signatures;
CREATE POLICY "Users can view their own signatures"
ON public.signatures FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own signatures
DROP POLICY IF EXISTS "Users can create their own signatures" ON public.signatures;
CREATE POLICY "Users can create their own signatures"
ON public.signatures FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own signatures
DROP POLICY IF EXISTS "Users can update their own signatures" ON public.signatures;
CREATE POLICY "Users can update their own signatures"
ON public.signatures FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own signatures
DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.signatures;
CREATE POLICY "Users can delete their own signatures"
ON public.signatures FOR DELETE
USING (auth.uid() = user_id);

-- Audit logs RLS
ALTER TABLE public.signature_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own signature audit logs" ON public.signature_audit_logs;
CREATE POLICY "Users can view their own signature audit logs"
ON public.signature_audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.signatures 
    WHERE signatures.id = signature_audit_logs.signature_id 
    AND signatures.user_id = auth.uid()
  )
);
