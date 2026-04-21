import { Migration } from '../migrations';

export const migration_040_add_site_amenities: Migration = {
  id: '040_add_site_amenities',
  version: 40,
  name: 'Add site_amenities column to projects table',
  checksum: 'd5e6f7g8h9i0',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_amenities JSONB DEFAULT '{}'::jsonb;
      COMMENT ON COLUMN projects.site_amenities IS 'JSON object containing site amenities like power, water, parking, etc.';
    `);
  },
  down: async (db) => {
    await db.execute(`ALTER TABLE projects DROP COLUMN IF EXISTS site_amenities;`);
  }
};
