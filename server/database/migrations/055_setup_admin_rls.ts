import { Migration } from '../migrations'

export const migration_055_setup_admin_rls: Migration = {
  id: '055_setup_admin_rls',
  version: 55,
  name: 'Setup admin RLS policies for users and contractor_profiles',
  checksum: 'a1d2m3i4n5r6l7s8p9o0l1i2c3i4e5s_v2',
  up: async (db) => {
    await db.execute(`
      -- 1. Users table policies
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

      -- Allow admins to see all users
      DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
      CREATE POLICY "Admins can view all users"
      ON public.users FOR SELECT
      USING (
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
      );

      -- Allow admins to update all users
      DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
      CREATE POLICY "Admins can update all users"
      ON public.users FOR UPDATE
      USING (
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
      );

      -- 2. Contractor Profiles table policies
      ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;

      -- Allow admins to see all contractor profiles
      DROP POLICY IF EXISTS "Admins can view all contractor profiles" ON public.contractor_profiles;
      CREATE POLICY "Admins can view all contractor profiles"
      ON public.contractor_profiles FOR SELECT
      USING (
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
      );

      -- Allow admins to update all contractor profiles
      DROP POLICY IF EXISTS "Admins can update all contractor profiles" ON public.contractor_profiles;
      CREATE POLICY "Admins can update all contractor profiles"
      ON public.contractor_profiles FOR UPDATE
      USING (
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
      );
    `)
  },
  down: async (db) => {
    await db.execute(`
      DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
      DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
      DROP POLICY IF EXISTS "Admins can view all contractor profiles" ON public.contractor_profiles;
      DROP POLICY IF EXISTS "Admins can update all contractor profiles" ON public.contractor_profiles;
    `)
  }
}
