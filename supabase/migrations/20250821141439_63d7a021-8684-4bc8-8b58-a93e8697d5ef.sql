-- Fix security_config table RLS policies to ensure no overly permissive access
-- Drop any potentially permissive policies that might exist
DROP POLICY IF EXISTS "System can update security config" ON public.security_config;
DROP POLICY IF EXISTS "Allow system updates" ON public.security_config;
DROP POLICY IF EXISTS "Enable public access" ON public.security_config;

-- Ensure only proper admin-restricted policies exist
DROP POLICY IF EXISTS "Only admins can read security config" ON public.security_config;
DROP POLICY IF EXISTS "Only admins can manage security config" ON public.security_config;

-- Create secure, admin-only policies
CREATE POLICY "Only admins can read security config" 
ON public.security_config 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage security config" 
ON public.security_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update security compliance status for this fix
UPDATE public.security_config 
SET 
  is_compliant = true,
  config_value = 'Admin-only RLS policies enforced',
  last_checked_at = now(),
  updated_at = now()
WHERE config_key = 'rls_policy_security_config'
OR config_key = 'security_config_access';

-- Insert tracking record if it doesn't exist
INSERT INTO public.security_config (config_key, config_value, is_compliant, last_checked_at)
VALUES ('rls_policy_security_config', 'Admin-only RLS policies enforced', true, now())
ON CONFLICT (config_key) DO UPDATE SET
  config_value = 'Admin-only RLS policies enforced',
  is_compliant = true,
  last_checked_at = now(),
  updated_at = now();