-- Allow authenticated admins to update any contractor profile.
-- Required for admin contractor-verification flow where admin uploads
-- GST/HST and WCB documents for another user's profile row.

DROP POLICY IF EXISTS "Admins can update contractor profiles" ON public.contractor_profiles;

CREATE POLICY "Admins can update contractor profiles"
ON public.contractor_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.user_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.user_role = 'admin'
  )
);
