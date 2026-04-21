import { Migration } from '../migrations';

export const migration_029_add_valid_until_to_transactions: Migration = {
  id: '029_add_valid_until_to_transactions',
  name: 'Add valid_until column to transactions table for subscription validity tracking',

  up: async (client) => {
    await client.query(`
      ALTER TABLE transactions 
      ADD COLUMN valid_until TIMESTAMPTZ;
    `);

    console.log('✅ Added valid_until column to transactions table');
  },

  down: async (client) => {
    await client.query(`
      ALTER TABLE transactions 
      DROP COLUMN IF EXISTS valid_until;
    `);

    console.log('✅ Removed valid_until column from transactions table');
  },
  version: 0,
  checksum: ''
};