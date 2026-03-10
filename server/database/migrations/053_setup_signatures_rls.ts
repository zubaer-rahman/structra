import { Migration } from '../migrations'

export const migration_053_setup_signatures_rls: Migration = {
  id: '053_setup_signatures_rls',
  version: 53,
  name: 'Setup RLS policies for signatures table',
  checksum: 's1i2g3n4a5t6u7r8e9r0l1s2p3o4l5i6',
  up: async (db) => {
    await db.execute(`
      -- Enable RLS on signatures table
      ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

      -- Allow users to view their own signatures
      DROP POLICY IF EXISTS "Users can view their own signatures" ON public.signatures;
      CREATE POLICY "Users can view their own signatures"
      ON public.signatures FOR SELECT
      USING (auth.uid() = user_id);

      -- Allow users to create their own signatures
      DROP POLICY IF EXISTS "Users can create their own signatures" ON public.signatures;
      CREATE POLICY "Users can create their own signatures"
      ON public.signatures FOR INSERT
      WITH CHECK (auth.uid() = user_id);

      -- Allow users to update their own signatures
      DROP POLICY IF EXISTS "Users can update their own signatures" ON public.signatures;
      CREATE POLICY "Users can update their own signatures"
      ON public.signatures FOR UPDATE
      USING (auth.uid() = user_id);

      -- Allow users to delete their own signatures
      DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.signatures;
      CREATE POLICY "Users can delete their own signatures"
      ON public.signatures FOR DELETE
      USING (auth.uid() = user_id);

      -- Audit logs RLS
      ALTER TABLE public.signature_audit_logs ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can view their own signature audit logs" ON public.signature_audit_logs;
      CREATE POLICY "Users can view their own signature audit logs"
      ON public.signature_audit_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.signatures 
          WHERE signatures.id = signature_audit_logs.signature_id 
          AND signatures.user_id = auth.uid()
        )
      );
    `)
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE public.signatures DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.signature_audit_logs DISABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view their own signatures" ON public.signatures;
      DROP POLICY IF EXISTS "Users can create their own signatures" ON public.signatures;
      DROP POLICY IF EXISTS "Users can update their own signatures" ON public.signatures;
      DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.signatures;
      DROP POLICY IF EXISTS "Users can view their own signature audit logs" ON public.signature_audit_logs;
    `)
  }
}
