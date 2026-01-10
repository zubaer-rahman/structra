import { Migration } from '../migrations'

export const migration_025_drop_payments_table: Migration = {
  id: '025_drop_payments_table',
  version: 25,
  name: 'Drop payments table (replacing with transactions)',
  checksum: 'h7i8j9k0l1m2', // Hash for payments table removal
  up: async (db) => {
    // Drop the payments table and all its indexes
    await db.execute(`
      DROP TABLE IF EXISTS public.payments CASCADE;
    `)
  },
  down: async (db) => {
    // Recreate the payments table from migration 020
    await db.execute(`
      CREATE TABLE public.payments (
        -- Base schema fields
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Core payment fields
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'requires_action', 'requires_confirmation')),
        external_payment_id TEXT NOT NULL,
        external_customer_id TEXT NOT NULL,
        external_subscription_id TEXT,
        external_invoice_id TEXT,
        payment_method_type TEXT NOT NULL CHECK (payment_method_type IN ('card', 'bank_transfer', 'digital_wallet', 'crypto', 'other')),
        payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'paypal', 'apple_pay', 'google_pay', 'other')),
        description TEXT NOT NULL,
        metadata JSONB,
        error_message TEXT,
        refunded_at DATE,
        refund_amount DECIMAL(10,2),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payment_type TEXT NOT NULL CHECK (payment_type IN ('project_creation', 'proposal_submission', 'subscription', 'project_view', 'other')),
        stripe_customer_id TEXT
      );
    `)

    // Recreate indexes
    await db.execute(`
      CREATE INDEX idx_payments_external_payment_id ON public.payments(external_payment_id);
      CREATE INDEX idx_payments_external_customer_id ON public.payments(external_customer_id);
      CREATE INDEX idx_payments_status ON public.payments(status);
      CREATE INDEX idx_payments_payment_provider ON public.payments(payment_provider);
      CREATE INDEX idx_payments_amount ON public.payments(amount);
      CREATE INDEX idx_payments_created_at ON public.payments(created_at);
      CREATE INDEX idx_payments_external_subscription_id ON public.payments(external_subscription_id);
      CREATE INDEX idx_payments_external_invoice_id ON public.payments(external_invoice_id);
    `)
  }
}
