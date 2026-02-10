import { Migration } from '../migrations';

export const migration_046_add_slug_fields: Migration = {
  id: '046_add_slug_fields',
  version: 46,
  name: 'Add slug columns to projects and contractor_profiles tables',
  checksum: 'j0k1l2m3n4o5',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;
      ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS slug TEXT;
      CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
      CREATE INDEX IF NOT EXISTS idx_contractor_profiles_slug ON contractor_profiles(slug);
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE projects DROP COLUMN IF EXISTS slug;
      ALTER TABLE contractor_profiles DROP COLUMN IF EXISTS slug;
    `);
  }
};
