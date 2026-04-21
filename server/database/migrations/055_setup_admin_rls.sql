-- RLS Policies for Admin Access

-- 1. Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow admins to see all users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users AS u
    WHERE u.id = auth.uid() AND u.user_role = 'admin'
  )
);

-- Allow admins to update all users
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users AS u
    WHERE u.id = auth.uid() AND u.user_role = 'admin'
  )
);

-- 2. Contractor Profiles table policies
ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;

-- Allow admins to see all contractor profiles
DROP POLICY IF EXISTS "Admins can view all contractor profiles" ON public.contractor_profiles;
CREATE POLICY "Admins can view all contractor profiles"
ON public.contractor_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND user_role = 'admin'
  )
);

-- Allow admins to update all contractor profiles
DROP POLICY IF EXISTS "Admins can update all contractor profiles" ON public.contractor_profiles;
CREATE POLICY "Admins can update all contractor profiles"
ON public.contractor_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND user_role = 'admin'
  )
);
