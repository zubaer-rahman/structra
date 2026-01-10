import { Migration } from '../migrations';

export const migration_031_add_delay_penalty_to_projects: Migration = {
  id: '031_add_delay_penalty_to_projects',
  version: 31,
  name: 'Add delay_penalty column to projects table',
  checksum: 'd4c3b2a1908f',
  up: async (db) => {
    await db.execute(`
      ALTER TABLE projects 
      ADD COLUMN delay_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL;
    `);
    
    await db.execute(`
      COMMENT ON COLUMN projects.delay_penalty IS 'Per day penalty amount for missed start date (homeowner) or missed end date (contractor). Default: $0. Recommended: 0.2% of contract value per day, capped at 30 days.';
    `);
  },
  down: async (db) => {
    await db.execute(`
      ALTER TABLE projects 
      DROP COLUMN delay_penalty;
    `);
  }
};
