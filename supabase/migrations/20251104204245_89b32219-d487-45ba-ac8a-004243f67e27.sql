-- Atualizar função get_ta_dashboard_by_date_range para contar leads únicos
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
    COUNT(DISTINCT lead_id) AS total_contactados,
    COUNT(DISTINCT CASE WHEN etapa = 'NAO_ATENDIDO' THEN lead_id END) AS nao_atendeu,
    COUNT(DISTINCT CASE WHEN etapa = 'LIGAR_DEPOIS' THEN lead_id END) AS ligar_depois,
    COUNT(DISTINCT CASE WHEN etapa = 'MARCAR' THEN lead_id END) AS marcar_whatsapp,
    COUNT(DISTINCT CASE WHEN etapa = 'OI' THEN lead_id END) AS agendados,
    COUNT(DISTINCT CASE WHEN etapa = 'NAO_TEM_INTERESSE' THEN lead_id END) AS nao_tem_interesse
  FROM ta_actions
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date;
END;
$function$;

-- Atualizar função get_ta_temporal_data_by_date_range para contar leads únicos
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
    COUNT(DISTINCT lead_id) AS total
  FROM ta_actions
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date
  GROUP BY DATE(created_at), ta_actions.etapa
  ORDER BY date, ta_actions.etapa;
END;
$function$;

-- Atualizar função get_ta_efficiency_metrics_by_date_range para contar leads únicos
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
    COUNT(DISTINCT lead_id),
    COUNT(DISTINCT CASE WHEN etapa = 'OI' THEN lead_id END)
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