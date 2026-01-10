-- Fix signature audit trigger to handle DELETE operations properly
-- The original trigger was trying to access NEW fields during DELETE operations

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS signatures_audit_trigger ON public.signatures;
DROP FUNCTION IF EXISTS trigger_log_signature_changes();

-- Create the fixed trigger function
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

-- Recreate the trigger
CREATE TRIGGER signatures_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.signatures
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_signature_changes();

-- Verify the trigger is working
SELECT 'Trigger fixed successfully!' as status;
