import { Migration } from '../migrations';

export const migration_030_add_work_guarantee_statement_to_contractor_profiles: Migration = {
  id: '030_add_work_guarantee_statement_to_contractor_profiles',
  version: 30,
  name: 'Add work_guarantee_statement column to contractor_profiles table',
  checksum: 'e6d5c4b3a291',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE contractor_profiles 
      ADD COLUMN work_guarantee_statement TEXT;
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE contractor_profiles 
      DROP COLUMN work_guarantee_statement;
    `);
  }
};
