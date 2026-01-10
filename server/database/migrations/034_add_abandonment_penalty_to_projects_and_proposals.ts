import { Migration } from '../migrations';

export const migration034_add_abandonment_penalty_to_projects_and_proposals: Migration = {
  id: '034_add_abandonment_penalty_to_projects_and_proposals',
  version: 34,
  name: 'Add abandonment_penalty column to projects and proposals tables',
  checksum: 'a1b2c3d4e5f6',
  up: async (db) => {
    // Add abandonment_penalty column to projects table
    await db.execute(`
      ALTER TABLE projects 
      ADD COLUMN abandonment_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL;
    `);

    // Add abandonment_penalty column to proposals table
    await db.execute(`
      ALTER TABLE proposals 
      ADD COLUMN abandonment_penalty DECIMAL(10,2) DEFAULT 0.00 NOT NULL;
    `);

    // Update existing projects to calculate abandonment penalty from delay penalty
    await db.execute(`
      UPDATE projects 
      SET abandonment_penalty = delay_penalty * 30 
      WHERE delay_penalty > 0;
    `);

    // Update existing proposals to calculate abandonment penalty from delay penalty
    await db.execute(`
      UPDATE proposals 
      SET abandonment_penalty = delay_penalty * 30 
      WHERE delay_penalty > 0;
    `);
  },
  down: async (db) => {
    // Remove abandonment_penalty column from proposals table
    await db.execute(`
      ALTER TABLE proposals 
      DROP COLUMN abandonment_penalty;
    `);

    // Remove abandonment_penalty column from projects table
    await db.execute(`
      ALTER TABLE projects 
      DROP COLUMN abandonment_penalty;
    `);
  }
};
