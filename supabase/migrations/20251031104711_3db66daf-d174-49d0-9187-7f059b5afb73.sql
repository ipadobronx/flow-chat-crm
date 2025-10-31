-- Corrigir função get_kpi_metrics_by_date_range para contar TODOS os leads criados no período
-- Independente da etapa atual, se foi criado em "Nova Rec", deve contar como rec

CREATE OR REPLACE FUNCTION public.get_kpi_metrics_by_date_range(
  p_user_id uuid,
  p_start_date text,
  p_end_date text
)
RETURNS TABLE (
  total_rec bigint,
  total_ligacoes bigint,
  total_oi_agendados bigint,
  total_proposta_apresentada bigint,
  total_n_realizado bigint,
  total_apolice_emitida bigint,
  taxa_conversao_ligacao numeric,
  taxa_conversao_oi numeric,
  taxa_conversao_proposta numeric,
  taxa_conversao_n numeric,
  taxa_conversao_apolice numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_rec bigint;
  v_total_ligacoes bigint;
  v_total_oi_agendados bigint;
  v_total_proposta_apresentada bigint;
  v_total_n_realizado bigint;
  v_total_apolice_emitida bigint;
BEGIN
  -- Contar TODOS os leads criados no período (independente da etapa atual)
  SELECT COUNT(*)
  INTO v_total_rec
  FROM leads
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date::date
    AND DATE(created_at) <= p_end_date::date;

  -- Contar leads que passaram por cada etapa no período
  SELECT COUNT(DISTINCT lead_id)
  INTO v_total_ligacoes
  FROM historico_etapas_funil
  WHERE user_id = p_user_id
    AND etapa_nova = 'Ligação'
    AND DATE(data_mudanca) >= p_start_date::date
    AND DATE(data_mudanca) <= p_end_date::date;

  SELECT COUNT(DISTINCT lead_id)
  INTO v_total_oi_agendados
  FROM historico_etapas_funil
  WHERE user_id = p_user_id
    AND etapa_nova = 'OI Agendado'
    AND DATE(data_mudanca) >= p_start_date::date
    AND DATE(data_mudanca) <= p_end_date::date;

  SELECT COUNT(DISTINCT lead_id)
  INTO v_total_proposta_apresentada
  FROM historico_etapas_funil
  WHERE user_id = p_user_id
    AND etapa_nova = 'Proposta Apresentada'
    AND DATE(data_mudanca) >= p_start_date::date
    AND DATE(data_mudanca) <= p_end_date::date;

  SELECT COUNT(DISTINCT lead_id)
  INTO v_total_n_realizado
  FROM historico_etapas_funil
  WHERE user_id = p_user_id
    AND etapa_nova = 'N Realizado'
    AND DATE(data_mudanca) >= p_start_date::date
    AND DATE(data_mudanca) <= p_end_date::date;

  SELECT COUNT(DISTINCT lead_id)
  INTO v_total_apolice_emitida
  FROM historico_etapas_funil
  WHERE user_id = p_user_id
    AND etapa_nova = 'Apólice Emitida'
    AND DATE(data_mudanca) >= p_start_date::date
    AND DATE(data_mudanca) <= p_end_date::date;

  -- Calcular taxas de conversão
  RETURN QUERY
  SELECT
    v_total_rec,
    v_total_ligacoes,
    v_total_oi_agendados,
    v_total_proposta_apresentada,
    v_total_n_realizado,
    v_total_apolice_emitida,
    CASE WHEN v_total_rec > 0 THEN ROUND((v_total_ligacoes::numeric / v_total_rec::numeric) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_ligacoes > 0 THEN ROUND((v_total_oi_agendados::numeric / v_total_ligacoes::numeric) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_oi_agendados > 0 THEN ROUND((v_total_proposta_apresentada::numeric / v_total_oi_agendados::numeric) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_proposta_apresentada > 0 THEN ROUND((v_total_n_realizado::numeric / v_total_proposta_apresentada::numeric) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_n_realizado > 0 THEN ROUND((v_total_apolice_emitida::numeric / v_total_n_realizado::numeric) * 100, 2) ELSE 0 END;
END;
$$;