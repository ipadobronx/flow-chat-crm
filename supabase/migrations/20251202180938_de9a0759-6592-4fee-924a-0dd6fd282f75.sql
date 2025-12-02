-- Função para métricas por profissão
CREATE OR REPLACE FUNCTION get_metrics_by_profissao(
  p_user_id uuid, 
  p_start_date date, 
  p_end_date date
)
RETURNS TABLE (
  profissao text,
  total bigint,
  nao_atendido bigint,
  ligar_depois bigint,
  marcar_whatsapp bigint,
  oi bigint,
  pc bigint,
  apolice_emitida bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(l.profissao, 'Não informado')::text as profissao,
    COUNT(DISTINCT l.id)::bigint as total,
    COUNT(DISTINCT l.id) FILTER (WHERE l.etapa = 'Não atendido')::bigint as nao_atendido,
    COUNT(DISTINCT l.id) FILTER (WHERE l.etapa = 'Ligar Depois')::bigint as ligar_depois,
    COUNT(DISTINCT l.id) FILTER (WHERE l.etapa = 'Marcar')::bigint as marcar_whatsapp,
    COUNT(DISTINCT l.id) FILTER (WHERE l.etapa IN ('OI', 'Delay OI'))::bigint as oi,
    COUNT(DISTINCT l.id) FILTER (WHERE l.etapa IN ('PC', 'Delay PC'))::bigint as pc,
    COUNT(DISTINCT l.id) FILTER (WHERE l.etapa = 'Apólice Emitida')::bigint as apolice_emitida
  FROM leads l
  WHERE l.user_id = p_user_id
    AND DATE(l.created_at) BETWEEN p_start_date AND p_end_date
  GROUP BY l.profissao
  ORDER BY total DESC;
END;
$$;

-- Função para métricas por etapa
CREATE OR REPLACE FUNCTION get_metrics_by_etapa(
  p_user_id uuid, 
  p_start_date date, 
  p_end_date date
)
RETURNS TABLE (
  etapa text,
  total bigint,
  percentual numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH totals AS (
    SELECT COUNT(*)::numeric as grand_total
    FROM leads l
    WHERE l.user_id = p_user_id
      AND DATE(l.created_at) BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    l.etapa::text,
    COUNT(*)::bigint as total,
    ROUND((COUNT(*)::numeric / NULLIF(t.grand_total, 0)) * 100, 1) as percentual
  FROM leads l
  CROSS JOIN totals t
  WHERE l.user_id = p_user_id
    AND DATE(l.created_at) BETWEEN p_start_date AND p_end_date
  GROUP BY l.etapa, t.grand_total
  ORDER BY total DESC;
END;
$$;