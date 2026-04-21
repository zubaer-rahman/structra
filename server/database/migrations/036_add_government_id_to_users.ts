import { Migration } from '../migrations';

export const migration_036_add_government_id_to_users: Migration = {
  id: '036_add_government_id_to_users',
  version: 36,
  name: 'Add government_id field to users table',
  checksum: 'a1b2c3d4e5f6',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN government_id JSONB;
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE users 
      DROP COLUMN government_id;
    `);
  }
};
