-- Atualizar função para calcular taxa_conversao_marcar_oi com base em leads contactados
CREATE OR REPLACE FUNCTION public.get_ta_efficiency_metrics(p_user_id uuid, p_period text DEFAULT '30 days'::text)
 RETURNS TABLE(total_contactados bigint, agendados bigint, leads_por_agendamento numeric, taxa_conversao_marcar_oi numeric, taxa_conversao_geral numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHEN total_contactados > 0 THEN ROUND((agendados::NUMERIC / total_contactados) * 100, 2)
    ELSE NULL
  END as taxa_conversao_marcar_oi,
  CASE
    WHEN total_contactados > 0 THEN ROUND((agendados::NUMERIC / total_contactados) * 100, 2)
    ELSE NULL
  END as taxa_conversao_geral
FROM totals;
$function$;