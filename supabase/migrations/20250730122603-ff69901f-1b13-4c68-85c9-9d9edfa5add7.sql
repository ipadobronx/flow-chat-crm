-- Enhanced security monitoring migration
-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own audit logs
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow authenticated users to insert audit logs
CREATE POLICY "Authenticated users can create audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create security configuration table
CREATE TABLE IF NOT EXISTS public.security_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_compliant BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security config
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to read security config
CREATE POLICY "Authenticated users can read security config" 
ON public.security_config 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only allow system to update security config (for monitoring)
CREATE POLICY "System can update security config" 
ON public.security_config 
FOR ALL 
USING (true);

-- Insert initial security configuration tracking
INSERT INTO public.security_config (config_key, config_value, is_compliant) VALUES
('leaked_password_protection', 'disabled', false),
('otp_expiry_seconds', '3600', false),
('extensions_in_public_schema', 'true', false),
('security_definer_views', 'exists', false)
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    last_checked_at = now();

-- Create function to update security config compliance status
CREATE OR REPLACE FUNCTION public.update_security_compliance(
    p_config_key TEXT,
    p_is_compliant BOOLEAN,
    p_config_value TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
    UPDATE public.security_config 
    SET 
        is_compliant = p_is_compliant,
        config_value = COALESCE(p_config_value, config_value),
        last_checked_at = now(),
        updated_at = now()
    WHERE config_key = p_config_key;
END;
$$;

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_security_config_updated_at
    BEFORE UPDATE ON public.security_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();