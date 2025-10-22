-- Função para obter métricas KPI por período
CREATE OR REPLACE FUNCTION public.get_kpi_metrics_by_date_range(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
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
SET search_path TO 'public'
AS $$
DECLARE
  v_total_rec BIGINT;
  v_total_ligacoes BIGINT;
  v_total_oi BIGINT;
  v_total_proposta BIGINT;
  v_total_n BIGINT;
  v_total_apolice BIGINT;
BEGIN
  -- Contar leads por etapa
  SELECT 
    COUNT(*) FILTER (WHERE etapa = 'Todos'),
    COUNT(*) FILTER (WHERE etapa NOT IN ('Todos', 'Novo')),
    COUNT(*) FILTER (WHERE etapa IN ('OI', 'Delay OI')),
    COUNT(*) FILTER (WHERE etapa IN ('PC', 'Delay PC')),
    COUNT(*) FILTER (WHERE etapa IN ('N', 'Não')),
    COUNT(*) FILTER (WHERE etapa = 'Apólice Emitida')
  INTO v_total_rec, v_total_ligacoes, v_total_oi, v_total_proposta, v_total_n, v_total_apolice
  FROM public.leads
  WHERE user_id = p_user_id
    AND DATE(created_at) >= p_start_date
    AND DATE(created_at) <= p_end_date;

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

-- Função para obter atividades diárias
CREATE OR REPLACE FUNCTION public.get_daily_activities_by_date(
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  id uuid,
  lead_id uuid,
  lead_nome text,
  lead_telefone text,
  etapa text,
  tipo_atividade text,
  prioridade text,
  descricao text,
  tempo_estimado text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.id as lead_id,
    l.nome as lead_nome,
    l.telefone as lead_telefone,
    l.etapa::text,
    CASE 
      WHEN l.etapa IN ('Novo', 'Todos') THEN 'Ligar'
      WHEN l.etapa IN ('OI', 'Delay OI') THEN 'Agendar OI'
      WHEN l.etapa IN ('PC', 'Delay PC') THEN 'Agendar PC'
      WHEN l.etapa = 'N' THEN 'Fechar Negócio'
      ELSE 'Follow-up'
    END as tipo_atividade,
    CASE 
      WHEN l.dias_na_etapa_atual > 7 THEN 'urgent'
      WHEN l.dias_na_etapa_atual > 3 THEN 'high'
      ELSE 'medium'
    END as prioridade,
    CASE 
      WHEN l.etapa IN ('Novo', 'Todos') THEN 'Realizar primeira ligação com ' || l.nome
      WHEN l.etapa IN ('OI', 'Delay OI') THEN 'Agendar apresentação de OI com ' || l.nome
      WHEN l.etapa IN ('PC', 'Delay PC') THEN 'Agendar apresentação de proposta comercial'
      WHEN l.etapa = 'N' THEN 'Finalizar negociação e emitir apólice'
      ELSE 'Fazer follow-up com ' || l.nome
    END as descricao,
    CASE 
      WHEN l.etapa IN ('Novo', 'Todos') THEN '15 min'
      WHEN l.etapa IN ('OI', 'Delay OI') THEN '30 min'
      WHEN l.etapa IN ('PC', 'Delay PC') THEN '45 min'
      ELSE '20 min'
    END as tempo_estimado
  FROM public.leads l
  WHERE l.user_id = p_user_id
    AND l.etapa NOT IN ('Apólice Emitida', 'Ligar Depois')
    AND (
      DATE(l.created_at) = p_date 
      OR DATE(l.data_callback) = p_date
      OR (l.dias_na_etapa_atual > 3 AND DATE(l.etapa_changed_at) <= p_date)
    )
  ORDER BY 
    CASE 
      WHEN l.dias_na_etapa_atual > 7 THEN 1
      WHEN l.dias_na_etapa_atual > 3 THEN 2
      ELSE 3
    END,
    l.etapa_changed_at ASC
  LIMIT 20;
END;
$$;

-- Função para obter atividades de follow-up
CREATE OR REPLACE FUNCTION public.get_followup_activities_by_date(
  p_user_id uuid,
  p_start_date date DEFAULT CURRENT_DATE,
  p_end_date date DEFAULT (CURRENT_DATE + INTERVAL '7 days')::date
)
RETURNS TABLE(
  id uuid,
  lead_id uuid,
  lead_nome text,
  tipo_atividade text,
  descricao text,
  due_date date,
  prioridade text,
  acao_requerida text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Aniversários
  SELECT 
    l.id,
    l.id as lead_id,
    l.nome as lead_nome,
    'birthday'::text as tipo_atividade,
    'Aniversário de ' || l.nome as descricao,
    l.data_nascimento as due_date,
    'medium'::text as prioridade,
    'Enviar mensagem de felicitações'::text as acao_requerida
  FROM public.leads l
  WHERE l.user_id = p_user_id
    AND l.data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM l.data_nascimento) = EXTRACT(MONTH FROM p_start_date)
    AND EXTRACT(DAY FROM l.data_nascimento) BETWEEN EXTRACT(DAY FROM p_start_date) AND EXTRACT(DAY FROM p_end_date)
    AND l.etapa = 'Apólice Emitida'
  
  UNION ALL
  
  -- Agendamentos pendentes
  SELECT 
    a.id,
    a.lead_id,
    l.nome as lead_nome,
    'agendamento'::text as tipo_atividade,
    'Ligação agendada com ' || l.nome as descricao,
    DATE(a.data_agendamento) as due_date,
    CASE 
      WHEN DATE(a.data_agendamento) = CURRENT_DATE THEN 'urgent'
      WHEN DATE(a.data_agendamento) = CURRENT_DATE + 1 THEN 'high'
      ELSE 'medium'
    END as prioridade,
    COALESCE(a.observacoes, 'Realizar ligação agendada')::text as acao_requerida
  FROM public.agendamentos_ligacoes a
  JOIN public.leads l ON l.id = a.lead_id
  WHERE a.user_id = p_user_id
    AND a.status = 'pendente'
    AND DATE(a.data_agendamento) BETWEEN p_start_date AND p_end_date
  
  UNION ALL
  
  -- Leads parados há muito tempo
  SELECT 
    l.id,
    l.id as lead_id,
    l.nome as lead_nome,
    'reminder'::text as tipo_atividade,
    'Lead parado em ' || l.etapa::text || ' há ' || l.dias_na_etapa_atual::text || ' dias' as descricao,
    CURRENT_DATE as due_date,
    'urgent'::text as prioridade,
    'Retomar contato urgentemente'::text as acao_requerida
  FROM public.leads l
  WHERE l.user_id = p_user_id
    AND l.dias_na_etapa_atual > 7
    AND l.etapa NOT IN ('Apólice Emitida', 'Ligar Depois', 'Todos')
  
  ORDER BY 
    CASE prioridade
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      ELSE 3
    END,
    due_date ASC
  LIMIT 30;
END;
$$;

-- Função para obter alertas críticos
CREATE OR REPLACE FUNCTION public.get_critical_alerts_by_date(
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  id uuid,
  lead_id uuid,
  lead_nome text,
  tipo_alerta text,
  titulo text,
  descricao text,
  severidade text,
  acao_requerida text,
  due_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Leads emperrados há mais de 14 dias
  SELECT 
    l.id,
    l.id as lead_id,
    l.nome as lead_nome,
    'stalled_deal'::text as tipo_alerta,
    'Lead Parado Há Muito Tempo'::text as titulo,
    l.nome || ' está em ' || l.etapa::text || ' há ' || l.dias_na_etapa_atual::text || ' dias sem movimento' as descricao,
    'critical'::text as severidade,
    'Retomar contato imediatamente ou mover para "Ligar Depois"'::text as acao_requerida,
    CURRENT_DATE as due_date
  FROM public.leads l
  WHERE l.user_id = p_user_id
    AND l.dias_na_etapa_atual > 14
    AND l.etapa NOT IN ('Apólice Emitida', 'Ligar Depois', 'Todos')
  
  UNION ALL
  
  -- Agendamentos atrasados
  SELECT 
    a.id,
    a.lead_id,
    l.nome as lead_nome,
    'missed_call'::text as tipo_alerta,
    'Ligação Não Realizada'::text as titulo,
    'Ligação com ' || l.nome || ' estava agendada para ' || TO_CHAR(a.data_agendamento, 'DD/MM/YYYY HH24:MI') as descricao,
    'high'::text as severidade,
    'Reagendar ligação o quanto antes'::text as acao_requerida,
    DATE(a.data_agendamento) as due_date
  FROM public.agendamentos_ligacoes a
  JOIN public.leads l ON l.id = a.lead_id
  WHERE a.user_id = p_user_id
    AND a.status = 'pendente'
    AND a.data_agendamento < NOW()
    AND DATE(a.data_agendamento) >= p_date - INTERVAL '7 days'
  
  UNION ALL
  
  -- Callbacks do dia não atendidos
  SELECT 
    l.id,
    l.id as lead_id,
    l.nome as lead_nome,
    'callback_pending'::text as tipo_alerta,
    'Callback Pendente'::text as titulo,
    l.nome || ' está aguardando retorno marcado para hoje' as descricao,
    'medium'::text as severidade,
    'Realizar ligação de retorno conforme combinado'::text as acao_requerida,
    l.data_callback as due_date
  FROM public.leads l
  WHERE l.user_id = p_user_id
    AND l.data_callback = p_date
    AND l.etapa IN ('Ligar Depois', 'Delay OI', 'Delay PC')
  
  ORDER BY 
    CASE severidade
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    due_date ASC
  LIMIT 20;
END;
$$;