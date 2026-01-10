import { Migration } from '../migrations';

export const migration_033_add_work_guarantee_statement_to_proposals: Migration = {
  id: '033_add_work_guarantee_statement_to_proposals',
  version: 33,
  name: 'Add work_guarantee_statement column to proposals table',
  checksum: 'f7e8d9c0b1a2',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE proposals 
      ADD COLUMN work_guarantee_statement TEXT;
    `);
    
    await db.execute(`
      COMMENT ON COLUMN proposals.work_guarantee_statement IS 'Work guarantee statement from contractor profile, included in proposal submission.';
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE proposals 
      DROP COLUMN work_guarantee_statement;
    `);
  }
};
