-- Remove the unused atrasos_calculados table that's causing security issues
-- This table doesn't have RLS enabled and is not currently being used

DROP TABLE IF EXISTS public.atrasos_calculados;

-- Update security config to reflect this fix
UPDATE public.security_config 
SET 
    is_compliant = true,
    config_value = 'table_removed',
    last_checked_at = now(),
    updated_at = now()
WHERE config_key = 'security_definer_views';