import { Migration } from '../migrations'

export const migration_057_add_user_self_rls: Migration = {
  id: '057_add_user_self_rls',
  version: 57,
  name: 'Add RLS policies for users to manage their own profile',
  checksum: 'u1s2e3r4s5e6l7f8m9a0n1a2g3e4m5e6n7t',
  up: async (db) => {
    await db.execute(`
      -- Allow users to view their own profile
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
      CREATE POLICY "Users can view their own profile"
      ON public.users FOR SELECT
      USING (auth.uid() = id);

      -- Allow users to update their own profile
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
      CREATE POLICY "Users can update their own profile"
      ON public.users FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    `)
  },
  down: async (db) => {
    await db.execute(`
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    `)
  }
}
