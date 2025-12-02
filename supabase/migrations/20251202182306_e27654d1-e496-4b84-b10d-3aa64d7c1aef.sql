-- Drop existing functions and recreate with correct logic
DROP FUNCTION IF EXISTS get_metrics_by_profissao(uuid, text, text);
DROP FUNCTION IF EXISTS get_metrics_by_etapa(uuid, text, text);

-- Function to get metrics by profession from ta_actions
CREATE OR REPLACE FUNCTION get_metrics_by_profissao(
  p_user_id UUID,
  p_start_date TEXT,
  p_end_date TEXT
)
RETURNS TABLE (
  profissao TEXT,
  total BIGINT,
  nao_atendido BIGINT,
  ligar_depois BIGINT,
  marcar_whatsapp BIGINT,
  oi BIGINT,
  pc BIGINT,
  apolice_emitida BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(l.profissao, 'Não informada') as profissao,
    COUNT(DISTINCT ta.lead_id) as total,
    COUNT(DISTINCT CASE WHEN ta.etapa = 'NAO_ATENDIDO' THEN ta.lead_id END) as nao_atendido,
    COUNT(DISTINCT CASE WHEN ta.etapa = 'LIGAR_DEPOIS' THEN ta.lead_id END) as ligar_depois,
    COUNT(DISTINCT CASE WHEN ta.etapa = 'MARCAR' THEN ta.lead_id END) as marcar_whatsapp,
    COUNT(DISTINCT CASE WHEN ta.etapa = 'OI' THEN ta.lead_id END) as oi,
    COUNT(DISTINCT CASE WHEN l.etapa = 'PC' THEN ta.lead_id END) as pc,
    COUNT(DISTINCT CASE WHEN l.etapa = 'Apólice Emitida' THEN ta.lead_id END) as apolice_emitida
  FROM ta_actions ta
  INNER JOIN leads l ON l.id = ta.lead_id
  WHERE ta.user_id = p_user_id
    AND ta.created_at >= p_start_date::timestamp with time zone
    AND ta.created_at < (p_end_date::date + interval '1 day')::timestamp with time zone
  GROUP BY COALESCE(l.profissao, 'Não informada')
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get metrics by etapa from ta_actions
CREATE OR REPLACE FUNCTION get_metrics_by_etapa(
  p_user_id UUID,
  p_start_date TEXT,
  p_end_date TEXT
)
RETURNS TABLE (
  etapa TEXT,
  total BIGINT,
  percentual NUMERIC
) AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Get total count first
  SELECT COUNT(*)
  INTO v_total_count
  FROM ta_actions ta
  WHERE ta.user_id = p_user_id
    AND ta.created_at >= p_start_date::timestamp with time zone
    AND ta.created_at < (p_end_date::date + interval '1 day')::timestamp with time zone;

  IF v_total_count = 0 THEN
    v_total_count := 1; -- Prevent division by zero
  END IF;

  RETURN QUERY
  SELECT 
    CASE ta.etapa
      WHEN 'NAO_ATENDIDO' THEN 'Não atendido'
      WHEN 'LIGAR_DEPOIS' THEN 'Ligar Depois'
      WHEN 'MARCAR' THEN 'Marcar'
      WHEN 'OI' THEN 'OI'
      WHEN 'NAO_TEM_INTERESSE' THEN 'Não'
      ELSE ta.etapa
    END as etapa,
    COUNT(*) as total,
    ROUND((COUNT(*) * 100.0 / v_total_count), 1) as percentual
  FROM ta_actions ta
  WHERE ta.user_id = p_user_id
    AND ta.created_at >= p_start_date::timestamp with time zone
    AND ta.created_at < (p_end_date::date + interval '1 day')::timestamp with time zone
  GROUP BY ta.etapa
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;