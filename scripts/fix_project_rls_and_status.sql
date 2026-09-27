-- Fix projects table RLS policies and status constraint
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Update the status check constraint to allow application statuses ('Draft', 'Open for Proposals', etc.)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN (
    'Draft', 'Open for Proposals', 'Proposal Selected', 'In Progress', 'Completed', 'Cancelled',
    'draft', 'open', 'in_progress', 'completed', 'cancelled'
  ));

-- 2. Make legacy 'title' column optional (since 'project_title' is now primarily used)
ALTER TABLE public.projects ALTER COLUMN title DROP NOT NULL;

-- 3. Set up and ensure correct Row Level Security (RLS) policies on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- SELECT policy: allow everyone to read projects
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
CREATE POLICY "Public projects are viewable by everyone"
ON public.projects FOR SELECT
USING (true);

-- INSERT policy: allow authenticated users to create projects
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
CREATE POLICY "Authenticated users can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creator OR 
  auth.uid() = homeowner_id OR 
  creator IS NULL
);

-- UPDATE policy: allow creators/homeowners and admins to update
DROP POLICY IF EXISTS "Creators can update their own projects" ON public.projects;
CREATE POLICY "Creators can update their own projects"
ON public.projects FOR UPDATE
TO authenticated
USING (auth.uid() = creator OR auth.uid() = homeowner_id)
WITH CHECK (auth.uid() = creator OR auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Admins can update all projects" ON public.projects;
CREATE POLICY "Admins can update all projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
);

-- DELETE policy: allow creators/homeowners and admins to delete
DROP POLICY IF EXISTS "Creators can delete their own projects" ON public.projects;
CREATE POLICY "Creators can delete their own projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = creator OR auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Admins can delete all projects" ON public.projects;
CREATE POLICY "Admins can delete all projects"
ON public.projects FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
