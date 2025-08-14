-- Create user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing security_config policy
DROP POLICY IF EXISTS "Authenticated users can read security config" ON public.security_config;

-- Create new restrictive policy for security_config
CREATE POLICY "Only admins can read security config"
ON public.security_config
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Keep the system update policy
CREATE POLICY "Only admins can manage security config"
ON public.security_config
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create public function to get security status for UI (limited info)
CREATE OR REPLACE FUNCTION public.get_security_status()
RETURNS TABLE(
  has_errors BOOLEAN,
  has_warnings BOOLEAN,
  error_count BIGINT,
  warning_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE NOT is_compliant AND config_key IN ('leaked_password_protection', 'security_definer_views')) > 0 AS has_errors,
    COUNT(*) FILTER (WHERE NOT is_compliant AND config_key NOT IN ('leaked_password_protection', 'security_definer_views')) > 0 AS has_warnings,
    COUNT(*) FILTER (WHERE NOT is_compliant AND config_key IN ('leaked_password_protection', 'security_definer_views')) AS error_count,
    COUNT(*) FILTER (WHERE NOT is_compliant AND config_key NOT IN ('leaked_password_protection', 'security_definer_views')) AS warning_count
  FROM public.security_config;
$$;

-- Insert default admin role for first user (replace with actual admin user_id)
-- Note: This should be updated with the actual admin user ID
INSERT INTO public.user_roles (user_id, role) 
SELECT auth.uid(), 'admin'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Trigger to update timestamps
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();