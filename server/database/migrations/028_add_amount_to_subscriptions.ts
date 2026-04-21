import { Migration } from '../migrations'

export const migration_028_add_amount_to_subscriptions: Migration = {
  id: '028_add_amount_to_subscriptions',
  version: 28,
  name: 'Add amount column to subscriptions table for payment tracking',
  checksum: 'k0l1m2n3o4p5', // Hash for subscriptions amount column addition
  up: async (db) => {
    // Add amount field to subscriptions table
    await db.execute(`
      ALTER TABLE public.subscriptions 
      ADD COLUMN IF NOT EXISTS amount INTEGER;
    `)
    
    // Create index for performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_amount 
      ON public.subscriptions(amount);
    `)
    
    // Add column comment
    await db.execute(`
      COMMENT ON COLUMN public.subscriptions.amount IS 'Payment amount in cents for this subscription';
    `)
  },
  down: async (db) => {
    // Remove the amount field
    await db.execute(`
      ALTER TABLE public.subscriptions 
      DROP COLUMN IF EXISTS amount;
    `)
    
    // Drop the index
    await db.execute(`
      DROP INDEX IF EXISTS idx_subscriptions_amount;
    `)
  }
}