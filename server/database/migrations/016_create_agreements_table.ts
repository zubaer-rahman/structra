import { Migration } from '../migrations'

export const migration_016_create_agreements_table: Migration = {
  id: '016_create_agreements_table',
  version: 16,
  name: 'Create agreements table based on comprehensive schema from image',
  checksum: 'b2c3d4e5f6g7', // Hash for agreements table creation
  up: async (db) => {
    // Create agreements table with all fields from the schema
    await db.execute(`
      CREATE TABLE public.agreements (
        -- Base schema fields
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Core agreement fields
        scope_of_work TEXT NOT NULL,
        contract_notes TEXT,
        
        -- Project and user relationships (flat ID references)
        proposal UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
        contractor UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        homeowner UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        
        -- Financial fields
        subtotal_amount DECIMAL(10,2) NOT NULL,
        tax_total DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        deposit_amount DECIMAL(10,2) NOT NULL,
        deposit_due_on DATE NOT NULL,
        
        -- Penalty fields
        abandonment_penalty DECIMAL(10,2) NOT NULL,
        delay_penalty DECIMAL(10,2) NOT NULL,
        
        -- Timeline fields
        scheduled_start_date DATE NOT NULL,
        scheduled_completion_date DATE NOT NULL,
        
        -- Status and workflow fields
        status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Signed', 'Active', 'Completed', 'Cancelled')),
        
        -- Permit handling
        permit_responsibility_user UUID REFERENCES public.users(id) ON DELETE SET NULL,
        
        -- Documentation
        custom_document_required TEXT CHECK (custom_document_required IN ('yes', 'no')) DEFAULT 'no' NOT NULL,
        attached_files JSONB DEFAULT '[]' NOT NULL,
        
        -- User tracking
        created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL
      );
    `)

    // Create indexes for performance
    await db.execute(`
      CREATE INDEX idx_agreements_proposal ON public.agreements(proposal);
      CREATE INDEX idx_agreements_contractor ON public.agreements(contractor);
      CREATE INDEX idx_agreements_homeowner ON public.agreements(homeowner);
      CREATE INDEX idx_agreements_status ON public.agreements(status);
      CREATE INDEX idx_agreements_scheduled_start_date ON public.agreements(scheduled_start_date);
      CREATE INDEX idx_agreements_scheduled_completion_date ON public.agreements(scheduled_completion_date);
      CREATE INDEX idx_agreements_deposit_due_on ON public.agreements(deposit_due_on);
      CREATE INDEX idx_agreements_total_amount ON public.agreements(total_amount);
      CREATE INDEX idx_agreements_created_by ON public.agreements(created_by);
      CREATE INDEX idx_agreements_permit_responsibility_user ON public.agreements(permit_responsibility_user);
    `)

    // Add comments for all columns (exact text from image)
    await db.execute(`
      COMMENT ON COLUMN public.agreements.scope_of_work IS 'Short summary';
      COMMENT ON COLUMN public.agreements.contract_notes IS 'Internal notes';
      COMMENT ON COLUMN public.agreements.proposal IS 'Source proposal';
      COMMENT ON COLUMN public.agreements.contractor IS 'Party performing the work';
      COMMENT ON COLUMN public.agreements.homeowner IS 'Party contracting the work';
      COMMENT ON COLUMN public.agreements.subtotal_amount IS 'Total before tax';
      COMMENT ON COLUMN public.agreements.tax_total IS 'Tax total on agreement';
      COMMENT ON COLUMN public.agreements.total_amount IS 'Full contract value';
      COMMENT ON COLUMN public.agreements.deposit_amount IS 'Upfront payment';
      COMMENT ON COLUMN public.agreements.deposit_due_on IS 'Deadline for initial deposit';
      COMMENT ON COLUMN public.agreements.abandonment_penalty IS 'Penalty if either party backs out before the project start date';
      COMMENT ON COLUMN public.agreements.delay_penalty IS 'Populates default contract clause; applies to missed start date for homeowners and missed end date for contractors';
      COMMENT ON COLUMN public.agreements.scheduled_start_date IS 'Planned start';
      COMMENT ON COLUMN public.agreements.scheduled_completion_date IS 'Estimated completion';
      COMMENT ON COLUMN public.agreements.status IS 'Draft, Sent, Signed, Active, etc.';
      COMMENT ON COLUMN public.agreements.permit_responsibility_user IS 'Who handles the permit process';
      COMMENT ON COLUMN public.agreements.custom_document_required IS 'Enables contractor-uploaded required docs';
      COMMENT ON COLUMN public.agreements.attached_files IS 'Supporting docs';
      COMMENT ON COLUMN public.agreements.created_by IS 'Creator of the record';
    `)

    // Update table comment
    await db.execute(`
      COMMENT ON TABLE public.agreements IS 'A contract derived from one proposal, with binding legal terms and payment rules';
    `)
  },
  down: async (db) => {
    // Drop the agreements table
    await db.execute(`
      DROP TABLE IF EXISTS public.agreements CASCADE;
    `)
  }
}
