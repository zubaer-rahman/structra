-- Create project_views table and setup RLS policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dwmwrlwgyftxoenqxmhh/sql

CREATE TABLE IF NOT EXISTS public.project_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_method TEXT NOT NULL DEFAULT 'Manual Paywall',
  can_submit_proposal TEXT NOT NULL DEFAULT 'yes',
  contractor UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at DATE,
  is_active TEXT NOT NULL DEFAULT 'yes',
  payment_transaction UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  project UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  view_status TEXT NOT NULL DEFAULT 'Viewed',
  viewed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  was_paid_view TEXT NOT NULL DEFAULT 'yes'
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_project_views_contractor ON public.project_views(contractor);
CREATE INDEX IF NOT EXISTS idx_project_views_project ON public.project_views(project);
CREATE INDEX IF NOT EXISTS idx_project_views_is_active ON public.project_views(is_active);
CREATE INDEX IF NOT EXISTS idx_project_views_expires_at ON public.project_views(expires_at);

-- Enable RLS and grants
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.project_views TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_views TO authenticated;

-- RLS Policies
DROP POLICY IF EXISTS "project_views_select_own" ON public.project_views;
DROP POLICY IF EXISTS "project_views_insert_own" ON public.project_views;
DROP POLICY IF EXISTS "project_views_update_own" ON public.project_views;

CREATE POLICY "project_views_select_own" ON public.project_views
  FOR SELECT TO authenticated
  USING (auth.uid() = contractor OR auth.uid() = created_by);

CREATE POLICY "project_views_insert_own" ON public.project_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = contractor OR auth.uid() = created_by);

CREATE POLICY "project_views_update_own" ON public.project_views
  FOR UPDATE TO authenticated
  USING (auth.uid() = contractor OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = contractor OR auth.uid() = created_by);
