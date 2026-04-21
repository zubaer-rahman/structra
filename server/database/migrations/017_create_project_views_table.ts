import { Migration } from '../migrations'

export const migration_017_create_project_views_table: Migration = {
  id: '017_create_project_views_table',
  version: 17,
  name: 'Create project_views table for tracking contractor access to projects',
  checksum: 'c3d4e5f6g7h8', // Hash for project views table creation
  up: async (db) => {
    // Create project_views table with all fields from the schema
    await db.execute(`
      CREATE TABLE public.project_views (
        -- Base schema fields
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Core view fields
        access_method TEXT NOT NULL CHECK (access_method IN ('Manual Paywall', 'Tier Access', 'Free Trial', 'Admin Grant', 'Referral Unlock', 'System Test')),
        can_submit_proposal TEXT CHECK (can_submit_proposal IN ('yes', 'no')) NOT NULL,
        contractor UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        expires_at DATE,
        is_active TEXT CHECK (is_active IN ('yes', 'no')) NOT NULL,
        payment_transaction UUID,
        project UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
        view_status TEXT NOT NULL CHECK (view_status IN ('Viewed', 'Preview Only', 'Not Completed', 'Blocked', 'Expired')),
        viewed_at DATE NOT NULL,
        was_paid_view TEXT CHECK (was_paid_view IN ('yes', 'no')) NOT NULL
      );
    `)

    // Create indexes for performance
    await db.execute(`
      CREATE INDEX idx_project_views_contractor ON public.project_views(contractor);
      CREATE INDEX idx_project_views_project ON public.project_views(project);
      CREATE INDEX idx_project_views_view_status ON public.project_views(view_status);
      CREATE INDEX idx_project_views_access_method ON public.project_views(access_method);
      CREATE INDEX idx_project_views_is_active ON public.project_views(is_active);
      CREATE INDEX idx_project_views_viewed_at ON public.project_views(viewed_at);
      CREATE INDEX idx_project_views_expires_at ON public.project_views(expires_at);
      CREATE INDEX idx_project_views_payment_transaction ON public.project_views(payment_transaction);
      CREATE INDEX idx_project_views_created_by ON public.project_views(created_by);
    `)

    // Add comments for all columns (exact text from image)
    await db.execute(`
      COMMENT ON COLUMN public.project_views.access_method IS 'Specifies how the project was accessed';
      COMMENT ON COLUMN public.project_views.can_submit_proposal IS 'A boolean indicator that shows whether the contractor is eligible to submit a proposal based on this particular view';
      COMMENT ON COLUMN public.project_views.contractor IS 'Refers to the user (contractor) who accessed or viewed the project';
      COMMENT ON COLUMN public.project_views.created_by IS 'Refers to the user who created this specific view record. The description notes this is typically "system-generated"';
      COMMENT ON COLUMN public.project_views.expires_at IS 'An optional date field indicating when this view will no longer be valid for accessing the proposal';
      COMMENT ON COLUMN public.project_views.is_active IS 'A boolean flag that marks whether the view is currently active and if it allows for proposal submission';
      COMMENT ON COLUMN public.project_views.payment_transaction IS 'Links to the transaction record if a payment was required to unlock the project view';
      COMMENT ON COLUMN public.project_views.project IS 'Refers to the specific project that was viewed';
      COMMENT ON COLUMN public.project_views.view_status IS 'Indicates the current status of the view';
      COMMENT ON COLUMN public.project_views.viewed_at IS 'A timestamp recording when the project was first accessed';
      COMMENT ON COLUMN public.project_views.was_paid_view IS 'A boolean indicator showing whether the contractor paid (either directly or indirectly) to unlock this view';
    `)

    // Update table comment
    await db.execute(`
      COMMENT ON TABLE public.project_views IS 'Tracks instances when a verified contractor unlocks or views a posted project for visibility control and monetization';
    `)
  },
  down: async (db) => {
    // Drop the project_views table
    await db.execute(`
      DROP TABLE IF EXISTS public.project_views CASCADE;
    `)
  }
}
