-- Fix proposals schema, foreign keys, and contractor_profiles
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dwmwrlwgyftxoenqxmhh/sql

-- 1. Ensure phone_number exists on contractor_profiles
ALTER TABLE public.contractor_profiles 
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Ensure all columns exist on proposals table
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS project UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS contractor UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS homeowner UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description_of_work TEXT,
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS tax_included TEXT DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_due_on DATE,
  ADD COLUMN IF NOT EXISTS delay_penalty NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS abandonment_penalty NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proposed_start_date DATE,
  ADD COLUMN IF NOT EXISTS proposed_end_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS clause_preview_html TEXT,
  ADD COLUMN IF NOT EXISTS attached_files JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS work_guarantee_statement TEXT,
  ADD COLUMN IF NOT EXISTS visibility_settings TEXT DEFAULT 'Private',
  ADD COLUMN IF NOT EXISTS is_selected TEXT DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS is_deleted TEXT DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS submitted_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS accepted_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejected_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS withdrawn_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS viewed_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason_notes TEXT,
  ADD COLUMN IF NOT EXISTS contract_reviewed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS homeowner_contract_reviewed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contract_reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS homeowner_contract_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Sync columns if project_id or contractor_id exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'proposals' AND column_name = 'project_id') THEN
    UPDATE public.proposals SET project = project_id WHERE project IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'proposals' AND column_name = 'contractor_id') THEN
    UPDATE public.proposals SET contractor = contractor_id WHERE contractor IS NULL;
  END IF;
END $$;

-- 3. Explicit foreign key constraints for Supabase PostgREST relationship discovery
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proposals_contractor_fkey'
  ) THEN
    ALTER TABLE public.proposals
      ADD CONSTRAINT proposals_contractor_fkey FOREIGN KEY (contractor) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proposals_project_fkey'
  ) THEN
    ALTER TABLE public.proposals
      ADD CONSTRAINT proposals_project_fkey FOREIGN KEY (project) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proposals_homeowner_fkey'
  ) THEN
    ALTER TABLE public.proposals
      ADD CONSTRAINT proposals_homeowner_fkey FOREIGN KEY (homeowner) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_proposals_project ON public.proposals(project);
CREATE INDEX IF NOT EXISTS idx_proposals_contractor ON public.proposals(contractor);
CREATE INDEX IF NOT EXISTS idx_proposals_homeowner ON public.proposals(homeowner);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_is_deleted ON public.proposals(is_deleted);

-- 5. Enable RLS and setup policies
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.proposals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.proposals TO authenticated;

DROP POLICY IF EXISTS "proposals_select_participants" ON public.proposals;
DROP POLICY IF EXISTS "proposals_insert_contractor" ON public.proposals;
DROP POLICY IF EXISTS "proposals_update_participants" ON public.proposals;
DROP POLICY IF EXISTS "proposals_delete_contractor" ON public.proposals;

CREATE POLICY "proposals_select_participants"
ON public.proposals
FOR SELECT
TO authenticated
USING (
  auth.uid() = contractor
  OR auth.uid() = homeowner
  OR auth.uid() = created_by
);

CREATE POLICY "proposals_insert_contractor"
ON public.proposals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = contractor
  OR auth.uid() = created_by
);

CREATE POLICY "proposals_update_participants"
ON public.proposals
FOR UPDATE
TO authenticated
USING (
  auth.uid() = contractor
  OR auth.uid() = homeowner
  OR auth.uid() = created_by
)
WITH CHECK (
  auth.uid() = contractor
  OR auth.uid() = homeowner
  OR auth.uid() = created_by
);

CREATE POLICY "proposals_delete_contractor"
ON public.proposals
FOR DELETE
TO authenticated
USING (
  auth.uid() = contractor
  OR auth.uid() = created_by
);
