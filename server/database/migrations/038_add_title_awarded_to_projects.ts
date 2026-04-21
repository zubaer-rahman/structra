import { Migration } from '../migrations';

export const migration_038_add_title_awarded_to_projects: Migration = {
  id: '038_add_title_awarded_to_projects',
  version: 38,
  name: 'Add title_awarded and certificate_of_title fields to projects table',
  checksum: 'c3d4e5f6g7h8',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS title_awarded BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS certificate_of_title TEXT;
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE projects 
      DROP COLUMN IF EXISTS title_awarded,
      DROP COLUMN IF EXISTS certificate_of_title;
    `);
  }
};
