-- Transactions RLS policies for Supabase
-- Run this in Supabase SQL Editor, or via psql.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;

CREATE POLICY "transactions_select_own"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
ON public.transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
ON public.transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
