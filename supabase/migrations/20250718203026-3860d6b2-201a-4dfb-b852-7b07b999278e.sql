-- Otimizações de Performance para Supabase - Corrigido
-- Esta migração adiciona índices estratégicos e otimizações para melhor performance

-- 1. ATIVAR EXTENSÃO pg_trgm PRIMEIRO
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. ÍNDICES PARA OTIMIZAÇÃO DE QUERIES

-- Índice composto para leads por usuário e etapa (muito usado em Pipeline)
CREATE INDEX IF NOT EXISTS idx_leads_user_etapa 
ON public.leads (user_id, etapa);

-- Índice para busca por nome (usando pg_trgm)
CREATE INDEX IF NOT EXISTS idx_leads_nome_gin 
ON public.leads USING gin (nome gin_trgm_ops);

-- Índice para data de nascimento (usado em aniversários)
CREATE INDEX IF NOT EXISTS idx_leads_nascimento_user 
ON public.leads (user_id, data_nascimento) 
WHERE data_nascimento IS NOT NULL;

-- Índice para datas de criação (usado em KPIs e charts)
CREATE INDEX IF NOT EXISTS idx_leads_created_user 
ON public.leads (user_id, created_at);

-- Índice para etapa_changed_at (usado em ActivityFeed)
CREATE INDEX IF NOT EXISTS idx_leads_etapa_changed 
ON public.leads (user_id, etapa_changed_at) 
WHERE etapa_changed_at IS NOT NULL;

-- Índice para agendamentos por data
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_user 
ON public.agendamentos_ligacoes (user_id, data_agendamento);

-- Índice para histórico de ligações por data
CREATE INDEX IF NOT EXISTS idx_ligacoes_data_user 
ON public.ligacoes_historico (user_id, data_ligacao);

-- 3. FUNÇÃO OTIMIZADA PARA BUSCAR LEADS COM MÉTRICAS

-- Função para buscar leads com contadores (evita múltiplas queries)
CREATE OR REPLACE FUNCTION public.get_leads_with_metrics(
  p_user_id uuid,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
  total_leads bigint,
  leads_atendidos bigint,
  oi_marcados bigint,
  virou_pc bigint,
  virou_n bigint,
  recomendacoes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE etapa NOT IN ('Todos', 'Ligar Depois', 'Novo')) as leads_atendidos,
    COUNT(*) FILTER (WHERE etapa IN ('OI', 'Delay OI')) as oi_marcados,
    COUNT(*) FILTER (WHERE etapa IN ('PC', 'Delay PC')) as virou_pc,
    COUNT(*) FILTER (WHERE etapa IN ('N', 'Não')) as virou_n,
    COUNT(*) FILTER (WHERE recomendante IS NOT NULL AND array_length(recomendante, 1) > 0) as recomendacoes
  FROM public.leads 
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
$$;

-- 4. FUNÇÃO PARA BUSCAR ANIVERSARIANTES DO DIA
CREATE OR REPLACE FUNCTION public.get_birthday_leads(
  p_user_id uuid,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id uuid,
  nome text,
  data_nascimento date,
  telefone text,
  idade integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    l.id,
    l.nome,
    l.data_nascimento,
    l.telefone,
    (DATE_PART('year', p_data) - DATE_PART('year', l.data_nascimento))::integer as idade
  FROM public.leads l
  WHERE l.user_id = p_user_id
    AND l.data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM l.data_nascimento) = EXTRACT(MONTH FROM p_data)
    AND EXTRACT(DAY FROM l.data_nascimento) = EXTRACT(DAY FROM p_data)
  ORDER BY l.nome;
$$;

-- 5. OTIMIZAÇÃO PARA LIGAÇÕES AGENDADAS
CREATE OR REPLACE FUNCTION public.get_scheduled_calls(
  p_user_id uuid,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id uuid,
  data_agendamento timestamp with time zone,
  observacoes text,
  status text,
  lead_id uuid,
  lead_nome text,
  lead_telefone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    a.id,
    a.data_agendamento,
    a.observacoes,
    a.status,
    a.lead_id,
    l.nome as lead_nome,
    l.telefone as lead_telefone
  FROM public.agendamentos_ligacoes a
  JOIN public.leads l ON l.id = a.lead_id
  WHERE a.user_id = p_user_id
    AND DATE(a.data_agendamento) = p_data
  ORDER BY a.data_agendamento;
$$;