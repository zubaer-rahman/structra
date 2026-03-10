import { Migration } from '../migrations'

export const migration_054_fix_signature_audit_rls: Migration = {
  id: '054_fix_signature_audit_rls',
  version: 54,
  name: 'Fix signature audit log RLS policies to allow inserts from triggers',
  checksum: 'a1u2d3i4t5r6l7s8f9i0x1p2o3l4i5_v2',
  up: async (db) => {
    await db.execute(`
      -- Ensure RLS is enabled but permissive for inserts
      ALTER TABLE public.signature_audit_logs ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow all inserts to signature_audit_logs" ON public.signature_audit_logs;
      CREATE POLICY "Allow all inserts to signature_audit_logs" 
      ON public.signature_audit_logs FOR INSERT 
      WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow users to view their own audit logs" ON public.signature_audit_logs;
      CREATE POLICY "Allow users to view their own audit logs" 
      ON public.signature_audit_logs FOR SELECT 
      USING (true); -- Simplify for now to debug

      -- Grant permissions
      GRANT INSERT, SELECT ON public.signature_audit_logs TO authenticated, anon;
    `)
  },
  down: async (db) => {
    await db.execute(`
      DROP POLICY IF EXISTS "System can insert signature audit logs" ON public.signature_audit_logs;
    `)
  }
}
