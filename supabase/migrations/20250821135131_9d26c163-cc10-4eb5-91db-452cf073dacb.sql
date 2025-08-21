-- Remove the overly permissive RLS policy that allows unrestricted access to security_config
DROP POLICY IF EXISTS "System can update security config" ON public.security_config;

-- Update security_config table to mark configuration issues that need manual fixing
UPDATE public.security_config 
SET 
  is_compliant = false,
  config_value = 'Manual configuration required',
  last_checked_at = now(),
  updated_at = now()
WHERE config_key IN ('leaked_password_protection', 'otp_expiry', 'extensions_schema');

-- Insert missing security configuration entries if they don't exist
INSERT INTO public.security_config (config_key, config_value, is_compliant, last_checked_at)
VALUES 
  ('leaked_password_protection', 'Manual configuration required', false, now()),
  ('otp_expiry', 'Manual configuration required', false, now()),
  ('extensions_schema', 'Manual configuration required', false, now())
ON CONFLICT (config_key) DO NOTHING;