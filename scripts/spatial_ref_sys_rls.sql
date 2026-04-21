-- Optional: silence advisor warning for PostGIS table public.spatial_ref_sys
-- Run in Supabase SQL Editor as a privileged role (table owner/supabase_admin).
-- This keeps table readable but prevents writes from anon/authenticated roles.

ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS spatial_ref_sys_read_anon ON public.spatial_ref_sys;
DROP POLICY IF EXISTS spatial_ref_sys_read_authenticated ON public.spatial_ref_sys;

CREATE POLICY spatial_ref_sys_read_anon
ON public.spatial_ref_sys
FOR SELECT
TO anon
USING (true);

CREATE POLICY spatial_ref_sys_read_authenticated
ON public.spatial_ref_sys
FOR SELECT
TO authenticated
USING (true);
