import { Migration } from '../migrations'

export const migration_000_create_migration_status_table: Migration = {
  id: '000_create_migration_status_table',
  version: 0,
  name: 'Create migration status tracking table',
  checksum: 'a1b2c3d4e5f6', // Hash for migration status table creation
  up: async (db) => {
    // Create migration status table for tracking applied migrations
    await db.execute(`
      CREATE TABLE IF NOT EXISTS public.migration_status (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum TEXT NOT NULL
      );
    `)

    // Create index for performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_migration_status_version ON public.migration_status(version);
    `)

    // Add table comment
    await db.execute(`
      COMMENT ON TABLE public.migration_status IS 'Tracks which database migrations have been applied';
    `)
  },
  down: async (db) => {
    // Drop the migration status table
    await db.execute(`
      DROP TABLE IF EXISTS public.migration_status CASCADE;
    `)
  }
}
