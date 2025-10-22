-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encryption key configuration (will use Supabase secret in production)
-- The encryption key should be stored in Supabase Vault or environment variable

-- Create helper functions for encryption/decryption
CREATE OR REPLACE FUNCTION encrypt_token(token text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from environment (managed by Supabase)
  -- In production, this would come from Supabase Vault
  encryption_key := COALESCE(
    current_setting('app.encryption_key', true),
    'CHANGE_THIS_ENCRYPTION_KEY_IN_PRODUCTION_VIA_VAULT'
  );
  
  RETURN pgp_sym_encrypt(token, encryption_key);
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from environment (managed by Supabase)
  encryption_key := COALESCE(
    current_setting('app.encryption_key', true),
    'CHANGE_THIS_ENCRYPTION_KEY_IN_PRODUCTION_VIA_VAULT'
  );
  
  RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
END;
$$;

-- Backup existing tokens before migration
CREATE TABLE IF NOT EXISTS google_calendar_tokens_backup AS 
SELECT * FROM google_calendar_tokens;

-- Create new columns for encrypted tokens
ALTER TABLE google_calendar_tokens 
ADD COLUMN IF NOT EXISTS access_token_encrypted bytea,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted bytea;

-- Migrate existing tokens to encrypted format
UPDATE google_calendar_tokens
SET 
  access_token_encrypted = encrypt_token(access_token),
  refresh_token_encrypted = encrypt_token(refresh_token)
WHERE access_token IS NOT NULL;

-- Drop old plaintext columns (keep commented for safety - uncomment after verifying)
-- ALTER TABLE google_calendar_tokens DROP COLUMN access_token;
-- ALTER TABLE google_calendar_tokens DROP COLUMN refresh_token;

-- Rename encrypted columns to original names after verification
-- ALTER TABLE google_calendar_tokens RENAME COLUMN access_token_encrypted TO access_token;
-- ALTER TABLE google_calendar_tokens RENAME COLUMN refresh_token_encrypted TO refresh_token;

-- Add comment documenting the encryption
COMMENT ON COLUMN google_calendar_tokens.access_token_encrypted IS 'OAuth access token encrypted with pgp_sym_encrypt';
COMMENT ON COLUMN google_calendar_tokens.refresh_token_encrypted IS 'OAuth refresh token encrypted with pgp_sym_encrypt';

-- Create view for easier access (handles decryption automatically)
CREATE OR REPLACE VIEW google_calendar_tokens_decrypted AS
SELECT 
  id,
  user_id,
  decrypt_token(access_token_encrypted) as access_token,
  decrypt_token(refresh_token_encrypted) as refresh_token,
  token_expiry,
  sync_enabled,
  last_sync_at,
  created_at,
  updated_at,
  calendar_id
FROM google_calendar_tokens
WHERE access_token_encrypted IS NOT NULL;

-- Grant appropriate permissions
GRANT SELECT ON google_calendar_tokens_decrypted TO authenticated;

-- Add RLS policy for the view (inherits from base table)
ALTER VIEW google_calendar_tokens_decrypted SET (security_invoker = on);