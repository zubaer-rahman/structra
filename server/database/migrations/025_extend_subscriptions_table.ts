import { Migration } from '../migrations'

export const migration_027_extend_subscriptions_table: Migration = {
  id: '027_extend_subscriptions_table',
  version: 27,
  name: 'Add stripe_subscription_id to subscriptions table for Stripe integration',
  checksum: 'j9k0l1m2n3o4', // Hash for subscriptions table extension
  up: async (db) => {
    // Add stripe_subscription_id field to subscriptions table
    await db.execute(`
      ALTER TABLE public.subscriptions 
      ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
    `)
    
    // Create index for performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id 
      ON public.subscriptions(stripe_subscription_id);
    `)
    
    // Add column comment
    await db.execute(`
      COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID for external linking and webhook processing';
    `)
  },
  down: async (db) => {
    // Remove the stripe_subscription_id field
    await db.execute(`
      ALTER TABLE public.subscriptions 
      DROP COLUMN IF EXISTS stripe_subscription_id;
    `)
    
    // Drop the index
    await db.execute(`
      DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
    `)
  }
}
