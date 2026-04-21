import { Migration } from '../migrations';

export const migration_050_remove_pid_unique_constraint: Migration = {
  id: '050_remove_pid_unique_constraint',
  version: 50,
  name: 'Remove unique constraint from pid column in projects table',
  checksum: 'n4o5p6q7r8s9',
  up: async (db) => {
    await db.execute(`
      -- In case there is a unique constraint on pid, remove it to allow duplicate PIDs if necessary
      -- (Note: This depends on the constraint name, usually projects_pid_key)
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_pid_key;
    `);
  },
  down: async (db) => {
    // We don't necessarily want to add it back if we intentionally removed it
  }
};
