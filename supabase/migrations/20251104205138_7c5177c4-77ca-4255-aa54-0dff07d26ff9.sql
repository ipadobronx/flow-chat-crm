-- Reverter funções RPC para contagem de ações totais (COUNT(*) ao invés de COUNT(DISTINCT lead_id))

CREATE OR REPLACE FUNCTION public.get_ta_dashboard_by_date_range(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  total_contactados bigint,
  nao_atendeu bigint,
  ligar_depois bigint,
  marcar_whatsapp bigint,
  agendados bigint,
  nao_tem_interesse bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_contactados,
    COUNT(*) FILTER (WHERE etapa = 'NAO_ATENDIDO') AS nao_atendeu,
    COUNT(*) FILTER (WHERE etapa = 'LIGAR_DEPOIS') AS ligar_depois,
    COUNT(*) FILTER (WHERE etapa = 'MARCAR') AS marcar_whatsapp,
    COUNT(*) FILTER (WHERE etapa = 'OI') AS agendados,
    COUNT(*) FILTER (WHERE etapa = 'NAO_TEM_INTERESSE') AS nao_tem_interesse
  FROM ta_actions
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_ta_temporal_data_by_date_range(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  date text,
  etapa text,
  total bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
    ta_actions.etapa,
    COUNT(*) AS total
  FROM ta_actions
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date
  GROUP BY DATE(created_at), ta_actions.etapa
  ORDER BY date, ta_actions.etapa;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_ta_efficiency_metrics_by_date_range(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  total_contactados bigint,
  agendados bigint,
  leads_por_agendamento numeric,
  taxa_conversao_marcar_oi numeric,
  taxa_conversao_geral numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_total_contactados BIGINT;
  v_agendados BIGINT;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE etapa = 'OI')
  INTO v_total_contactados, v_agendados
  FROM ta_actions
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date;

  RETURN QUERY
  SELECT
    v_total_contactados,
    v_agendados,
    CASE WHEN v_agendados > 0 THEN ROUND(v_total_contactados::NUMERIC / v_agendados, 2) ELSE 0 END AS leads_por_agendamento,
    CASE WHEN v_total_contactados > 0 THEN ROUND((v_agendados::NUMERIC / v_total_contactados) * 100, 2) ELSE 0 END AS taxa_conversao_marcar_oi,
    CASE WHEN v_total_contactados > 0 THEN ROUND((v_agendados::NUMERIC / v_total_contactados) * 100, 2) ELSE 0 END AS taxa_conversao_geral;
END;
$function$;