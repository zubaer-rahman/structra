import { Migration } from '../migrations';

export const migration_032_add_delay_penalty_to_proposals: Migration = {
  id: '032_add_delay_penalty_to_proposals',
  version: 32,
  name: 'Add delay_penalty column to proposals table',
  checksum: 'c3b2a1908f7e',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE proposals 
      ADD COLUMN delay_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL;
    `);
    
    await db.execute(`
      COMMENT ON COLUMN proposals.delay_penalty IS 'Per day penalty amount for missed deadlines. Inherited from project or modified by contractor.';
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE proposals 
      DROP COLUMN delay_penalty;
    `);
  }
};
