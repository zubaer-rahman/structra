import { Migration } from '../migrations';

export const migration_048_add_homeowner_contract_reviewed_column: Migration = {
  id: '048_add_homeowner_contract_reviewed_column',
  version: 48,
  name: 'Add homeowner_contract_reviewed column to agreements table',
  checksum: 'l2m3n4o5p6q7',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE agreements ADD COLUMN IF NOT EXISTS homeowner_contract_reviewed BOOLEAN DEFAULT FALSE;
      COMMENT ON COLUMN agreements.homeowner_contract_reviewed IS 'Indicates if the homeowner has reviewed the contract details';
    `);
  },
  down: async (db) => {
    await db.execute(`ALTER TABLE agreements DROP COLUMN IF EXISTS homeowner_contract_reviewed;`);
  }
};
