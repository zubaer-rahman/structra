import { Migration } from '../migrations'

export const migration_056_setup_projects_rls: Migration = {
  id: '056_setup_projects_rls',
  version: 56,
  name: 'Setup RLS policies for projects table',
  checksum: 'p1r2o3j4e5c6t7s8r9l0s1p2o3l4i5c6i7e8s',
  up: async (db) => {
    await db.execute(`
      -- Enable RLS on projects table
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

      -- 1. SELECT policies
      -- Allow everyone to view public projects
      DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
      CREATE POLICY "Public projects are viewable by everyone"
      ON public.projects FOR SELECT
      USING (true);

      -- 2. INSERT policies
      -- Allow authenticated users to create projects
      DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
      CREATE POLICY "Authenticated users can create projects"
      ON public.projects FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = creator);

      -- 3. UPDATE policies
      -- Allow creators to update their own projects
      DROP POLICY IF EXISTS "Creators can update their own projects" ON public.projects;
      CREATE POLICY "Creators can update their own projects"
      ON public.projects FOR UPDATE
      TO authenticated
      USING (auth.uid() = creator)
      WITH CHECK (auth.uid() = creator);

      -- Allow admins to update all projects
      DROP POLICY IF EXISTS "Admins can update all projects" ON public.projects;
      CREATE POLICY "Admins can update all projects"
      ON public.projects FOR UPDATE
      TO authenticated
      USING (
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
      );

      -- 4. DELETE policies
      -- Allow creators to delete their own projects (usually only if draft)
      DROP POLICY IF EXISTS "Creators can delete their own projects" ON public.projects;
      CREATE POLICY "Creators can delete their own projects"
      ON public.projects FOR DELETE
      TO authenticated
      USING (auth.uid() = creator);

      -- Allow admins to delete all projects
      DROP POLICY IF EXISTS "Admins can delete all projects" ON public.projects;
      CREATE POLICY "Admins can delete all projects"
      ON public.projects FOR DELETE
      TO authenticated
      USING (
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
      );
    `)
  },
  down: async (db) => {
    await db.execute(`
      DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
      DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
      DROP POLICY IF EXISTS "Creators can update their own projects" ON public.projects;
      DROP POLICY IF EXISTS "Admins can update all projects" ON public.projects;
      DROP POLICY IF EXISTS "Creators can delete their own projects" ON public.projects;
      DROP POLICY IF EXISTS "Admins can delete all projects" ON public.projects;
    `)
  }
}
