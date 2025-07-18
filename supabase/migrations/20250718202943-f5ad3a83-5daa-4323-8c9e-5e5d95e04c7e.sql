-- Otimizações de Performance para Supabase
-- Esta migração adiciona índices estratégicos e otimizações para melhor performance

-- 1. ÍNDICES PARA OTIMIZAÇÃO DE QUERIES

-- Índice composto para leads por usuário e etapa (muito usado em Pipeline)
CREATE INDEX IF NOT EXISTS idx_leads_user_etapa 
ON public.leads (user_id, etapa);

-- Índice para busca por nome (usado em pesquisas)
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

-- 2. OTIMIZAÇÃO DE RLS POLICIES COM FUNÇÃO DE CACHE

-- Função para obter user_id atual (melhora performance das RLS policies)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

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

-- 4. FUNÇÃO PARA BUSCAR ATIVIDADES RECENTES (OTIMIZADA)

CREATE OR REPLACE FUNCTION public.get_recent_activities(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id text,
  tipo text,
  titulo text,
  descricao text,
  data_atividade timestamp with time zone,
  nome_lead text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Ligações recentes
  SELECT 
    'ligacao-' || lh.id::text as id,
    'ligacao' as tipo,
    'Ligação via ' || lh.tipo as titulo,
    'Contato realizado com ' || l.nome as descricao,
    lh.data_ligacao as data_atividade,
    l.nome as nome_lead
  FROM public.ligacoes_historico lh
  JOIN public.leads l ON l.id = lh.lead_id
  WHERE lh.user_id = p_user_id
  
  UNION ALL
  
  -- Mudanças de etapa recentes
  SELECT 
    'mudanca-' || l.id::text as id,
    'mudanca_etapa' as tipo,
    'Lead movido para ' || l.etapa::text as titulo,
    l.nome || ' foi movido para a etapa ' || l.etapa::text as descricao,
    l.etapa_changed_at as data_atividade,
    l.nome as nome_lead
  FROM public.leads l
  WHERE l.user_id = p_user_id 
    AND l.etapa_changed_at IS NOT NULL
  
  ORDER BY data_atividade DESC
  LIMIT p_limit;
$$;

-- 5. ATIVAR EXTENSÃO pg_trgm PARA BUSCA TEXTUAL OTIMIZADA
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 6. FUNÇÃO PARA BUSCAR ANIVERSARIANTES DO DIA
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
    DATE_PART('year', p_data) - DATE_PART('year', l.data_nascimento) as idade
  FROM public.leads l
  WHERE l.user_id = p_user_id
    AND l.data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM l.data_nascimento) = EXTRACT(MONTH FROM p_data)
    AND EXTRACT(DAY FROM l.data_nascimento) = EXTRACT(DAY FROM p_data)
  ORDER BY l.nome;
$$;

-- 7. OTIMIZAÇÃO PARA LIGAÇÕES AGENDADAS
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

-- 8. TRIGGER PARA INVALIDAR CACHE QUANDO NECESSÁRIO
CREATE OR REPLACE FUNCTION public.invalidate_cache_on_lead_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Este trigger pode ser usado futuramente para invalidar caches
  -- quando dados importantes dos leads mudarem
  RETURN NEW;
END;
$$;

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON FUNCTION public.get_leads_with_metrics IS 
'Função otimizada para buscar métricas de leads evitando múltiplas queries';

COMMENT ON FUNCTION public.get_recent_activities IS 
'Função otimizada para buscar atividades recentes combinando ligações e mudanças de etapa';

COMMENT ON INDEX idx_leads_user_etapa IS 
'Índice composto para otimizar queries por usuário e etapa';

COMMENT ON INDEX idx_leads_nome_gin IS 
'Índice GIN para busca textual rápida por nome usando trigrams';