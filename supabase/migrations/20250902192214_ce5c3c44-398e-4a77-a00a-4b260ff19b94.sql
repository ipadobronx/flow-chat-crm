-- Create the ta_actions table for granular TA tracking
CREATE TABLE public.ta_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  etapa TEXT NOT NULL CHECK (
    etapa IN ('NAO_ATENDIDO', 'LIGAR_DEPOIS', 'MARCAR', 'OI')
  ),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ta_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ta_actions
CREATE POLICY "Users can view their own TA actions" 
ON public.ta_actions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own TA actions" 
ON public.ta_actions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TA actions" 
ON public.ta_actions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to get TA dashboard data
CREATE OR REPLACE FUNCTION public.get_ta_dashboard(
  p_user_id UUID,
  p_period TEXT DEFAULT '7 days'
)
RETURNS TABLE(
  total_contactados BIGINT,
  nao_atendeu BIGINT,
  ligar_depois BIGINT,
  marcar_whatsapp BIGINT,
  agendados BIGINT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
SELECT
  COUNT(*) as total_contactados,
  COUNT(*) FILTER (WHERE etapa = 'NAO_ATENDIDO') as nao_atendeu,
  COUNT(*) FILTER (WHERE etapa = 'LIGAR_DEPOIS') as ligar_depois,
  COUNT(*) FILTER (WHERE etapa = 'MARCAR') as marcar_whatsapp,
  COUNT(*) FILTER (WHERE etapa = 'OI') as agendados
FROM public.ta_actions
WHERE user_id = p_user_id
  AND created_at >= now() - CAST(p_period AS INTERVAL);
$$;

-- Create function to get temporal TA data for charts
CREATE OR REPLACE FUNCTION public.get_ta_temporal_data(
  p_user_id UUID,
  p_period TEXT DEFAULT '7 days'
)
RETURNS TABLE(
  date TEXT,
  etapa TEXT,
  total BIGINT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
SELECT
  to_char(created_at, 'YYYY-MM-DD') as date,
  etapa,
  COUNT(*) as total
FROM public.ta_actions
WHERE user_id = p_user_id
  AND created_at >= now() - CAST(p_period AS INTERVAL)
GROUP BY date, etapa
ORDER BY date ASC;
$$;

-- Create function to get TA efficiency metrics (inverse rules)
CREATE OR REPLACE FUNCTION public.get_ta_efficiency_metrics(
  p_user_id UUID,
  p_period TEXT DEFAULT '30 days'
)
RETURNS TABLE(
  total_contactados BIGINT,
  agendados BIGINT,
  leads_por_agendamento NUMERIC,
  taxa_conversao_marcar_oi NUMERIC,
  taxa_conversao_geral NUMERIC
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
WITH totals AS (
  SELECT
    COUNT(*) as total_contactados,
    COUNT(*) FILTER (WHERE etapa = 'OI') as agendados,
    COUNT(*) FILTER (WHERE etapa = 'MARCAR') as marcados
  FROM public.ta_actions
  WHERE user_id = p_user_id
    AND created_at >= now() - CAST(p_period AS INTERVAL)
)
SELECT
  total_contactados,
  agendados,
  CASE
    WHEN agendados > 0 THEN ROUND(total_contactados::NUMERIC / agendados, 2)
    ELSE NULL
  END as leads_por_agendamento,
  CASE
    WHEN marcados > 0 THEN ROUND((agendados::NUMERIC / marcados) * 100, 2)
    ELSE NULL
  END as taxa_conversao_marcar_oi,
  CASE
    WHEN total_contactados > 0 THEN ROUND((agendados::NUMERIC / total_contactados) * 100, 2)
    ELSE NULL
  END as taxa_conversao_geral
FROM totals;
$$;

-- Create trigger for automatic updated_at
CREATE TRIGGER update_ta_actions_updated_at
BEFORE UPDATE ON public.ta_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();