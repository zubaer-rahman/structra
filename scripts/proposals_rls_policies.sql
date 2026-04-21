-- Proposals RLS policies for Supabase
-- Run this in Supabase SQL Editor for the active project.

-- Ensure authenticated users can access proposals table at privilege level
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.proposals TO authenticated;

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to keep this script re-runnable
DROP POLICY IF EXISTS "proposals_select_participants" ON public.proposals;
DROP POLICY IF EXISTS "proposals_insert_contractor" ON public.proposals;
DROP POLICY IF EXISTS "proposals_update_participants" ON public.proposals;
DROP POLICY IF EXISTS "proposals_delete_contractor" ON public.proposals;

-- Read proposals if you are a participant (contractor/homeowner) or creator
CREATE POLICY "proposals_select_participants"
ON public.proposals
FOR SELECT
TO authenticated
USING (
  auth.uid() = contractor
  OR auth.uid() = homeowner
  OR auth.uid() = created_by
);

-- Contractors can insert proposals only for themselves, and only on projects they do not own
CREATE POLICY "proposals_insert_contractor"
ON public.proposals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = contractor
  AND auth.uid() = created_by
  AND auth.uid() = last_modified_by
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = proposals.project
      AND p.creator = proposals.homeowner
      AND p.creator <> auth.uid()
  )
);

-- Contractor or homeowner participant can update; owner checks preserved
CREATE POLICY "proposals_update_participants"
ON public.proposals
FOR UPDATE
TO authenticated
USING (
  auth.uid() = contractor
  OR auth.uid() = homeowner
)
WITH CHECK (
  auth.uid() = contractor
  OR auth.uid() = homeowner
);

-- Contractor can delete own proposal rows
CREATE POLICY "proposals_delete_contractor"
ON public.proposals
FOR DELETE
TO authenticated
USING (auth.uid() = contractor);
