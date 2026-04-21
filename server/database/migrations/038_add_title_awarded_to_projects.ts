import { Migration } from '../migrations';

export const migration_038_add_title_awarded_to_projects: Migration = {
  id: '038_add_title_awarded_to_projects',
  version: 38,
  name: 'Add title_awarded and certificate_of_title fields to projects table',
  checksum: 'c3d4e5f6g7h8',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE projects 
      ADD COLUMN title_awarded BOOLEAN DEFAULT FALSE,
      ADD COLUMN project_certificate JSONB;
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE projects 
      DROP COLUMN title_awarded,
      DROP COLUMN project_certificate;
    `);
  }
};
