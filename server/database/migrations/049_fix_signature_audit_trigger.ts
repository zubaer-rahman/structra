import { Migration } from '../migrations'

export const migration_049_fix_signature_audit_trigger: Migration = {
  id: '049_fix_signature_audit_trigger',
  version: 49,
  name: 'Fix signature audit trigger to handle DELETE operations properly',
  checksum: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
  up: async (db) => {
    // Drop the existing trigger and function
    await db.execute(`DROP TRIGGER IF EXISTS signatures_audit_trigger ON public.signatures;`)
    await db.execute(`DROP FUNCTION IF EXISTS trigger_log_signature_changes();`)

    // Create the fixed trigger function
    await db.execute(`
      CREATE OR REPLACE FUNCTION trigger_log_signature_changes()
      RETURNS TRIGGER AS $$
      DECLARE
        old_values JSONB;
        new_values JSONB;
        signature_id UUID;
        user_id_val UUID;
        signer_role_val TEXT;
        ip_address_val INET;
        user_agent_val TEXT;
      BEGIN
        -- Handle different operation types
        IF TG_OP = 'DELETE' THEN
          -- For DELETE operations, use OLD record
          signature_id := OLD.id;
          user_id_val := OLD.user_id;
          signer_role_val := OLD.signer_role;
          ip_address_val := OLD.ip_address;
          user_agent_val := OLD.user_agent;
          old_values := to_jsonb(OLD);
          new_values := NULL;
        ELSE
          -- For INSERT and UPDATE operations, use NEW record
          signature_id := NEW.id;
          user_id_val := NEW.user_id;
          signer_role_val := NEW.signer_role;
          ip_address_val := NEW.ip_address;
          user_agent_val := NEW.user_agent;
          old_values := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
          new_values := to_jsonb(NEW);
        END IF;
        
        -- Log the event
        PERFORM log_signature_event(
          signature_id,
          TG_OP,
          user_id_val,
          signer_role_val,
          ip_address_val,
          user_agent_val,
          '{}',
          old_values,
          new_values
        );
        
        -- Return appropriate record
        IF TG_OP = 'DELETE' THEN
          RETURN OLD;
        ELSE
          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Recreate the trigger
    await db.execute(`
      CREATE TRIGGER signatures_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.signatures
        FOR EACH ROW
        EXECUTE FUNCTION trigger_log_signature_changes();
    `)

    // Verify the trigger is working
    await db.execute(`SELECT 'Trigger fixed successfully!' as status;`)
  },

  down: async (db) => {
    // Drop the trigger and function
    await db.execute(`DROP TRIGGER IF EXISTS signatures_audit_trigger ON public.signatures;`)
    await db.execute(`DROP FUNCTION IF EXISTS trigger_log_signature_changes();`)

    // Recreate the original (broken) trigger function
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
  }
}
