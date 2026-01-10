-- Signature RLS policies for Supabase
-- Run this in Supabase SQL Editor for the active project.

-- Ensure authenticated users can access the table at privilege level
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.signatures TO authenticated;

-- Enable RLS
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make script re-runnable
DROP POLICY IF EXISTS "signatures_select_own" ON public.signatures;
DROP POLICY IF EXISTS "signatures_insert_own" ON public.signatures;
DROP POLICY IF EXISTS "signatures_update_own" ON public.signatures;
DROP POLICY IF EXISTS "signatures_delete_own" ON public.signatures;

-- Read only own signatures
CREATE POLICY "signatures_select_own"
ON public.signatures
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Insert only for yourself
CREATE POLICY "signatures_insert_own"
ON public.signatures
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update only your own rows, and prevent changing ownership
CREATE POLICY "signatures_update_own"
ON public.signatures
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Delete only your own rows
CREATE POLICY "signatures_delete_own"
ON public.signatures
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
