-- Consolidated migration for contractor_profiles and transactions tables
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/dwmwrlwgyftxoenqxmhh/sql

-- 1. Ensure all columns exist on contractor_profiles
ALTER TABLE public.contractor_profiles 
  ADD COLUMN IF NOT EXISTS company_logo_image JSONB,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS portfolio_file JSONB,
  ADD COLUMN IF NOT EXISTS license_file JSONB,
  ADD COLUMN IF NOT EXISTS insurance_certificate JSONB,
  ADD COLUMN IF NOT EXISTS gst_hst_clearance_document JSONB,
  ADD COLUMN IF NOT EXISTS wcb_clearance_document JSONB,
  ADD COLUMN IF NOT EXISTS is_admin_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_verification_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_insurance_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS legal_entity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gst_hst_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS wcb_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS insurance_general_liability NUMERIC,
  ADD COLUMN IF NOT EXISTS insurance_builders_risk NUMERIC,
  ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
  ADD COLUMN IF NOT EXISTS insurance_upload TEXT,
  ADD COLUMN IF NOT EXISTS work_guarantee NUMERIC,
  ADD COLUMN IF NOT EXISTS work_guarantee_statement TEXT,
  ADD COLUMN IF NOT EXISTS contractor_contacts JSONB DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_slug ON public.contractor_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_company_logo_image ON public.contractor_profiles USING GIN (company_logo_image);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_portfolio_file ON public.contractor_profiles USING GIN (portfolio_file);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_license_file ON public.contractor_profiles USING GIN (license_file);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_insurance_certificate ON public.contractor_profiles USING GIN (insurance_certificate);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_admin_verified ON public.contractor_profiles (is_admin_verified);

-- 2. Create transactions table if not exists
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CAD',
  transaction_type TEXT NOT NULL,
  status TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  description TEXT,
  metadata JSONB,
  valid_until TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount INTEGER,
  payment_method TEXT,
  billing_cycle TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON public.transactions(stripe_checkout_session_id);

-- Enable RLS on transactions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;

CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
