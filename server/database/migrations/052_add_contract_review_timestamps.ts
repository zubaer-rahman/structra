import { Migration } from '../migrations';

export const migration_052_add_contract_review_timestamps: Migration = {
  id: '052_add_contract_review_timestamps',
  version: 52,
  name: 'Add contract review timestamp columns to agreements table',
  checksum: 'p6q7r8s9t0u1',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE agreements 
      ADD COLUMN IF NOT EXISTS contractor_reviewed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS homeowner_reviewed_at TIMESTAMP WITH TIME ZONE;
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE agreements 
      DROP COLUMN IF EXISTS contractor_reviewed_at,
      DROP COLUMN IF EXISTS homeowner_reviewed_at;
    `);
  }
};
