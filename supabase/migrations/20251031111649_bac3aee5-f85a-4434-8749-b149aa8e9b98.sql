-- Dropar todas as versões da função KPI
DROP FUNCTION IF EXISTS public.get_kpi_metrics_by_date_range(uuid, text, text);
DROP FUNCTION IF EXISTS public.get_kpi_metrics_by_date_range(uuid, date, date);

-- Criar função KPI com todos os 6 cards do dashboard
-- 1. Nº de rec (total_rec)
-- 2. Ligações (total_ligacoes) 
-- 3. OIs Agendados (total_oi_agendados)
-- 4. Proposta apresentada (total_proposta_apresentada)
-- 5. N Realizado (total_n_realizado)
-- 6. Apólice Emitida (total_apolice_emitida)

CREATE FUNCTION public.get_kpi_metrics_by_date_range(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
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
  v_total_rec BIGINT;
  v_total_ligacoes BIGINT;
  v_total_oi BIGINT;
  v_total_proposta BIGINT;
  v_total_n BIGINT;
  v_total_apolice BIGINT;
BEGIN
  -- 1. Nº de rec: Total de leads criados no período
  SELECT COUNT(*)
  INTO v_total_rec
  FROM leads
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date;

  -- 2. Ligações: leads que já saíram de "Todos" e "Novo"
  SELECT COUNT(*)
  INTO v_total_ligacoes
  FROM leads
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date
    AND etapa NOT IN ('Todos', 'Novo');

  -- 3. OIs Agendados: etapa OI ou Delay OI
  SELECT COUNT(*)
  INTO v_total_oi
  FROM leads
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date
    AND etapa IN ('OI', 'Delay OI');

  -- 4. Proposta apresentada: etapa PC ou Delay PC
  SELECT COUNT(*)
  INTO v_total_proposta
  FROM leads
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date
    AND etapa IN ('PC', 'Delay PC');

  -- 5. N Realizado: etapa N
  SELECT COUNT(*)
  INTO v_total_n
  FROM leads
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date
    AND etapa = 'N';

  -- 6. Apólice Emitida: etapa Apólice Emitida
  SELECT COUNT(*)
  INTO v_total_apolice
  FROM leads
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date
    AND etapa = 'Apólice Emitida';

  -- Retornar métricas com taxas de conversão
  RETURN QUERY
  SELECT
    v_total_rec,
    v_total_ligacoes,
    v_total_oi,
    v_total_proposta,
    v_total_n,
    v_total_apolice,
    CASE WHEN v_total_rec > 0 THEN ROUND((v_total_ligacoes::NUMERIC / v_total_rec) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_ligacoes > 0 THEN ROUND((v_total_oi::NUMERIC / v_total_ligacoes) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_oi > 0 THEN ROUND((v_total_proposta::NUMERIC / v_total_oi) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_proposta > 0 THEN ROUND((v_total_n::NUMERIC / v_total_proposta) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_n > 0 THEN ROUND((v_total_apolice::NUMERIC / v_total_n) * 100, 2) ELSE 0 END;
END;
$$;

COMMENT ON FUNCTION public.get_kpi_metrics_by_date_range IS 
'Calcula os 6 KPIs do dashboard: Nº rec, Ligações, OI, PC, N, Apólice';