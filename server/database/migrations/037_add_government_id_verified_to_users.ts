import { Migration } from '../migrations';

export const migration_037_add_government_id_verified_to_users: Migration = {
  id: '037_add_government_id_verified_to_users',
  version: 37,
  name: 'Add government_id_verified field to users table',
  checksum: 'b2c3d4e5f6g7',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN government_id_verified BOOLEAN DEFAULT FALSE;
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE users 
      DROP COLUMN government_id_verified;
    `);
  }
};
