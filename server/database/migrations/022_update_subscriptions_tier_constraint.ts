import { Migration } from '../migrations'

export const migration_022_update_subscriptions_tier_constraint: Migration = {
  id: '022_update_subscriptions_tier_constraint',
  version: 22,
  name: 'update_subscriptions_tier_constraint',
  checksum: '022_update_subscriptions_tier_constraint_checksum',
  
  async up(client) {
    // First, drop the existing constraint if it exists
    await client.query(`
      ALTER TABLE public.subscriptions 
      DROP CONSTRAINT IF EXISTS subscriptions_tier_level_check;
    `)

    // Add the new constraint with correct tier values
    await client.query(`
      ALTER TABLE public.subscriptions 
      ADD CONSTRAINT subscriptions_tier_level_check 
      CHECK (tier_level IN ('free', 'verified', 'premium', 'admin_test', 'suspended'));
    `)

    // Update any existing records that might have old tier values
    // (This is a safety measure in case there are existing records)
    await client.query(`
      UPDATE public.subscriptions 
      SET tier_level = 'free' 
      WHERE tier_level NOT IN ('free', 'verified', 'premium', 'admin_test', 'suspended');
    `)

    // Add comment explaining the constraint
    await client.query(`
      COMMENT ON CONSTRAINT subscriptions_tier_level_check ON public.subscriptions 
      IS 'Ensures tier_level matches the application tier constants';
    `)
  },

  async down(client) {
    // Revert to the old constraint
    await client.query(`
      ALTER TABLE public.subscriptions 
      DROP CONSTRAINT IF EXISTS subscriptions_tier_level_check;
    `)

    await client.query(`
      ALTER TABLE public.subscriptions 
      ADD CONSTRAINT subscriptions_tier_level_check 
      CHECK (tier_level IN ('Basic', 'Pro', 'Enterprise'));
    `)
  }
}
