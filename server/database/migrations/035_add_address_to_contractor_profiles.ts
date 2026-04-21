import { Migration } from '../migrations';

export const migration_035_add_address_to_contractor_profiles: Migration = {
  id: '035_add_address_to_contractor_profiles',
  version: 35,
  name: 'Add address field to contractor_profiles table',
  checksum: 'f7e8d9c0b1a2',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE contractor_profiles 
      ADD COLUMN address JSONB;
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE contractor_profiles 
      DROP COLUMN address;
    `);
  }
};
