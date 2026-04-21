import { Migration } from '../migrations'

export const migration_026_create_transactions_table: Migration = {
  id: '026_create_transactions_table',
  version: 26,
  name: 'Create transactions table for comprehensive monetization tracking',
  checksum: 'i8j9k0l1m2n3', // Hash for transactions table creation
  up: async (db) => {
    // Create transactions table
    await db.execute(`
      CREATE TABLE public.transactions (
        -- Base schema fields
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Core transaction fields
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
        
        -- Amount and currency
        amount INTEGER NOT NULL CHECK (amount > 0),
        currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
        
        -- Transaction type based on image monetization strategies
        transaction_type TEXT NOT NULL CHECK (
          transaction_type IN (
            'contractor_verification_fee',
            'project_verification_fee', 
            'project_ppv',
            'subscription_renewal',
            'other'
          )
        ),
        
        -- Status tracking
        status TEXT NOT NULL CHECK (
          status IN (
            'pending',
            'processing', 
            'succeeded',
            'failed',
            'cancelled',
            'refunded'
          )
        ),
        
        -- Stripe integration fields
        stripe_payment_intent_id TEXT,
        stripe_checkout_session_id TEXT,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        
        -- Description and metadata
        description TEXT NOT NULL,
        metadata JSONB,
        
        -- Error handling and refunds
        error_message TEXT,
        refunded_at TIMESTAMP WITH TIME ZONE,
        refund_amount INTEGER CHECK (refund_amount > 0),
        
        -- Additional context
        payment_method TEXT CHECK (
          payment_method IN ('card', 'bank_transfer', 'digital_wallet', 'other')
        ),
        billing_cycle TEXT CHECK (
          billing_cycle IN ('one_time', 'annual', 'monthly')
        )
      );
    `)
    
    // Create indexes for performance
    await db.execute(`
      CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
      CREATE INDEX idx_transactions_project_id ON public.transactions(project_id);
      CREATE INDEX idx_transactions_subscription_id ON public.transactions(subscription_id);
      CREATE INDEX idx_transactions_transaction_type ON public.transactions(transaction_type);
      CREATE INDEX idx_transactions_status ON public.transactions(status);
      CREATE INDEX idx_transactions_amount ON public.transactions(amount);
      CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
      CREATE INDEX idx_transactions_stripe_payment_intent_id ON public.transactions(stripe_payment_intent_id);
      CREATE INDEX idx_transactions_stripe_customer_id ON public.transactions(stripe_customer_id);
    `)
    
    // Add table comments
    await db.execute(`
      COMMENT ON TABLE public.transactions IS 'Financial transactions for all platform monetization including contractor verification ($400/year), project verification ($29.99), and project PPV ($9.99) with comprehensive Stripe integration';
      COMMENT ON COLUMN public.transactions.amount IS 'Amount in cents (e.g., 40000 for $400.00)';
      COMMENT ON COLUMN public.transactions.currency IS 'ISO 4217 currency code (e.g., USD, CAD)';
      COMMENT ON COLUMN public.transactions.transaction_type IS 'Type of transaction based on monetization strategy';
      COMMENT ON COLUMN public.transactions.status IS 'Current status of the transaction';
      COMMENT ON COLUMN public.transactions.metadata IS 'Provider-specific metadata and additional information';
    `)
  },
  down: async (db) => {
    // Drop the transactions table
    await db.execute(`
      DROP TABLE IF EXISTS public.transactions CASCADE;
    `)
  }
}
