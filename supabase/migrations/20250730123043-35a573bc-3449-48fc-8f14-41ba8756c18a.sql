-- Remove the unused atrasos_calculados view that's causing security issues
-- This view doesn't have RLS configured and is not currently being used

DROP VIEW IF EXISTS public.atrasos_calculados;

-- Update security config to reflect this fix
UPDATE public.security_config 
SET 
    is_compliant = true,
    config_value = 'view_removed',
    last_checked_at = now(),
    updated_at = now()
WHERE config_key = 'security_definer_views';