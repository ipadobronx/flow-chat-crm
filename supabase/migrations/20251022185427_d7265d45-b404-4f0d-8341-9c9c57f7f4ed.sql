-- Função para obter dados do dashboard TA por intervalo de datas
CREATE OR REPLACE FUNCTION get_ta_dashboard_by_date_range(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_contactados BIGINT,
  nao_atendeu BIGINT,
  ligar_depois BIGINT,
  marcar_whatsapp BIGINT,
  agendados BIGINT,
  nao_tem_interesse BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE etapa_situacao IN ('NAO_ATENDIDO', 'MARCAR', 'LIGAR_DEPOIS', 'OI', 'NAO_TEM_INTERESSE')) AS total_contactados,
    COUNT(*) FILTER (WHERE etapa_situacao = 'NAO_ATENDIDO') AS nao_atendeu,
    COUNT(*) FILTER (WHERE etapa_situacao = 'LIGAR_DEPOIS') AS ligar_depois,
    COUNT(*) FILTER (WHERE etapa_situacao = 'MARCAR') AS marcar_whatsapp,
    COUNT(*) FILTER (WHERE etapa_situacao = 'OI') AS agendados,
    COUNT(*) FILTER (WHERE etapa_situacao = 'NAO_TEM_INTERESSE') AS nao_tem_interesse
  FROM tentativa_leads
  WHERE id_usuario = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter dados temporais TA por intervalo de datas
CREATE OR REPLACE FUNCTION get_ta_temporal_data_by_date_range(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date TEXT,
  etapa TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
    etapa_situacao AS etapa,
    COUNT(*) AS total
  FROM tentativa_leads
  WHERE id_usuario = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date
    AND etapa_situacao IN ('NAO_ATENDIDO', 'MARCAR', 'LIGAR_DEPOIS', 'OI', 'NAO_TEM_INTERESSE')
  GROUP BY DATE(created_at), etapa_situacao
  ORDER BY date, etapa_situacao;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter métricas de eficiência TA por intervalo de datas
CREATE OR REPLACE FUNCTION get_ta_efficiency_metrics_by_date_range(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_contactados BIGINT,
  agendados BIGINT,
  leads_por_agendamento NUMERIC,
  taxa_conversao_marcar_oi NUMERIC,
  taxa_conversao_geral NUMERIC
) AS $$
DECLARE
  v_total_contactados BIGINT;
  v_agendados BIGINT;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE etapa_situacao IN ('NAO_ATENDIDO', 'MARCAR', 'LIGAR_DEPOIS', 'OI', 'NAO_TEM_INTERESSE')),
    COUNT(*) FILTER (WHERE etapa_situacao = 'OI')
  INTO v_total_contactados, v_agendados
  FROM tentativa_leads
  WHERE id_usuario = p_user_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER;