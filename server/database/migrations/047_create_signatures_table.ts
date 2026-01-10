import { Migration } from '../migrations'

export const migration_047_create_signatures_table: Migration = {
  id: '047_create_signatures_table',
  version: 47,
  name: 'Create signatures table for digital signature management',
  checksum: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  up: async (db) => {
    // Create signatures table
    await db.execute(`
      CREATE TABLE public.signatures (
        -- Base schema fields
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Signature data
        signature_data TEXT NOT NULL, -- Base64 encoded signature image
        signature_type TEXT NOT NULL DEFAULT 'handwritten' CHECK (signature_type IN ('handwritten', 'typed', 'uploaded')),
        
        -- User and document relationships
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        document_id UUID, -- Can reference agreements, proposals, or other documents
        document_type TEXT, -- 'agreement', 'proposal', 'contract', etc.
        
        -- Signature metadata
        signer_name TEXT NOT NULL,
        signer_email TEXT,
        signer_role TEXT, -- 'contractor', 'homeowner', 'admin'
        
        -- Verification and security
        ip_address INET,
        user_agent TEXT,
        signature_hash TEXT, -- Hash of signature data for verification
        is_verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP WITH TIME ZONE,
        
        -- Status tracking
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'verified', 'rejected', 'expired')),
        expires_at TIMESTAMP WITH TIME ZONE,
        
        -- Additional metadata
        metadata JSONB DEFAULT '{}' NOT NULL
      );
    `)

    // Create indexes for performance
    await db.execute(`
      CREATE INDEX idx_signatures_user_id ON public.signatures(user_id);
    `)
    
    await db.execute(`
      CREATE INDEX idx_signatures_document_id ON public.signatures(document_id);
    `)
    
    await db.execute(`
      CREATE INDEX idx_signatures_document_type ON public.signatures(document_type);
    `)
    
    await db.execute(`
      CREATE INDEX idx_signatures_status ON public.signatures(status);
    `)
    
    await db.execute(`
      CREATE INDEX idx_signatures_created_at ON public.signatures(created_at);
    `)

    // Create signature_audit_logs table for tracking signature events
    await db.execute(`
      CREATE TABLE public.signature_audit_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        signature_id UUID REFERENCES public.signatures(id) ON DELETE CASCADE NOT NULL,
        action TEXT NOT NULL, -- 'created', 'signed', 'verified', 'rejected', 'expired', 'modified'
        actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        actor_role TEXT,
        
        -- Additional context
        ip_address INET,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}' NOT NULL,
        
        -- Previous and new values for tracking changes
        previous_values JSONB,
        new_values JSONB
      );
    `)

    // Create indexes for audit logs
    await db.execute(`
      CREATE INDEX idx_signature_audit_logs_signature_id ON public.signature_audit_logs(signature_id);
    `)
    
    await db.execute(`
      CREATE INDEX idx_signature_audit_logs_created_at ON public.signature_audit_logs(created_at);
    `)

    // Add signature fields to agreements table
    await db.execute(`
      ALTER TABLE public.agreements 
      ADD COLUMN homeowner_signature_id UUID REFERENCES public.signatures(id) ON DELETE SET NULL,
      ADD COLUMN contractor_signature_id UUID REFERENCES public.signatures(id) ON DELETE SET NULL,
      ADD COLUMN signature_deadline TIMESTAMP WITH TIME ZONE,
      ADD COLUMN signature_reminder_sent_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN fully_signed_at TIMESTAMP WITH TIME ZONE;
    `)

    // Create function to generate signature hash
    await db.execute(`
      CREATE OR REPLACE FUNCTION generate_signature_hash(signature_data TEXT)
      RETURNS TEXT AS $$
      BEGIN
        RETURN encode(digest(signature_data, 'sha256'), 'hex');
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create function to log signature events
    await db.execute(`
      CREATE OR REPLACE FUNCTION log_signature_event(
        p_signature_id UUID,
        p_action TEXT,
        p_actor_id UUID DEFAULT NULL,
        p_actor_role TEXT DEFAULT NULL,
        p_ip_address INET DEFAULT NULL,
        p_user_agent TEXT DEFAULT NULL,
        p_metadata JSONB DEFAULT '{}',
        p_previous_values JSONB DEFAULT NULL,
        p_new_values JSONB DEFAULT NULL
      )
      RETURNS VOID AS $$
      BEGIN
        INSERT INTO public.signature_audit_logs (
          signature_id, action, actor_id, actor_role, 
          ip_address, user_agent, metadata, 
          previous_values, new_values
        ) VALUES (
          p_signature_id, p_action, p_actor_id, p_actor_role,
          p_ip_address, p_user_agent, p_metadata,
          p_previous_values, p_new_values
        );
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create trigger to automatically log signature events
    await db.execute(`
      CREATE OR REPLACE FUNCTION trigger_log_signature_changes()
      RETURNS TRIGGER AS $$
      DECLARE
        old_values JSONB;
        new_values JSONB;
      BEGIN
        -- Convert OLD and NEW records to JSONB
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
        
        -- Log the event
        PERFORM log_signature_event(
          NEW.id,
          TG_OP,
          NEW.user_id,
          NEW.signer_role,
          NEW.ip_address,
          NEW.user_agent,
          '{}',
          old_values,
          new_values
        );
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    await db.execute(`
      CREATE TRIGGER signatures_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.signatures
        FOR EACH ROW
        EXECUTE FUNCTION trigger_log_signature_changes();
    `)
  },

  down: async (db) => {
    // Drop triggers and functions
    await db.execute(`DROP TRIGGER IF EXISTS signatures_audit_trigger ON public.signatures;`)
    await db.execute(`DROP FUNCTION IF EXISTS trigger_log_signature_changes();`)
    await db.execute(`DROP FUNCTION IF EXISTS log_signature_event(UUID, TEXT, UUID, TEXT, INET, TEXT, JSONB, JSONB, JSONB);`)
    await db.execute(`DROP FUNCTION IF EXISTS generate_signature_hash(TEXT);`)

    // Remove signature fields from agreements table
    await db.execute(`
      ALTER TABLE public.agreements 
      DROP COLUMN IF EXISTS homeowner_signature_id,
      DROP COLUMN IF EXISTS contractor_signature_id,
      DROP COLUMN IF EXISTS signature_deadline,
      DROP COLUMN IF EXISTS signature_reminder_sent_at,
      DROP COLUMN IF EXISTS fully_signed_at;
    `)

    // Drop tables
    await db.execute(`DROP TABLE IF EXISTS public.signature_audit_logs;`)
    await db.execute(`DROP TABLE IF EXISTS public.signatures;`)
  }
}
