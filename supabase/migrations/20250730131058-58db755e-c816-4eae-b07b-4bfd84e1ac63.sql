-- Criar tabela para histórico específico do TA
CREATE TABLE public.ta_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  user_id UUID NOT NULL,
  etapa_anterior etapa_funil,
  etapa_nova etapa_funil NOT NULL,
  data_mudanca TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  ta_order_anterior INTEGER,
  ta_order_nova INTEGER,
  origem TEXT DEFAULT 'ta', -- para distinguir mudanças que vieram do TA
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ta_historico ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view their own TA history" 
ON public.ta_historico 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own TA history" 
ON public.ta_historico 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_ta_historico_lead_id ON public.ta_historico(lead_id);
CREATE INDEX idx_ta_historico_user_id ON public.ta_historico(user_id);
CREATE INDEX idx_ta_historico_data_mudanca ON public.ta_historico(data_mudanca DESC);

-- Função para registrar mudanças específicas do TA
CREATE OR REPLACE FUNCTION public.registrar_mudanca_ta()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se a mudança foi feita em lead que está ou esteve no TA
  IF NEW.incluir_ta = true OR OLD.incluir_ta = true THEN
    -- Só registra se houve mudança na etapa ou ordem do TA
    IF OLD.etapa IS DISTINCT FROM NEW.etapa OR OLD.ta_order IS DISTINCT FROM NEW.ta_order THEN
      INSERT INTO public.ta_historico (
        lead_id, 
        user_id,
        etapa_anterior, 
        etapa_nova,
        ta_order_anterior,
        ta_order_nova,
        observacoes
      )
      VALUES (
        NEW.id, 
        NEW.user_id,
        OLD.etapa, 
        NEW.etapa,
        OLD.ta_order,
        NEW.ta_order,
        CASE 
          WHEN OLD.etapa IS DISTINCT FROM NEW.etapa THEN 
            'Mudança de etapa no TA: ' || COALESCE(OLD.etapa::text, 'Sem etapa') || ' → ' || NEW.etapa::text
          WHEN OLD.ta_order IS DISTINCT FROM NEW.ta_order THEN
            'Reordenação no TA: posição ' || COALESCE(OLD.ta_order::text, '0') || ' → ' || COALESCE(NEW.ta_order::text, '0')
          ELSE 'Mudança detectada no TA'
        END
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp';

-- Criar trigger para a tabela leads
CREATE TRIGGER trigger_registrar_mudanca_ta
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_mudanca_ta();

-- Função para buscar histórico do TA com filtros
CREATE OR REPLACE FUNCTION public.get_ta_historico(
  p_user_id UUID,
  p_lead_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  id UUID,
  lead_id UUID,
  lead_nome TEXT,
  etapa_anterior etapa_funil,
  etapa_nova etapa_funil,
  data_mudanca TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  ta_order_anterior INTEGER,
  ta_order_nova INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    th.id,
    th.lead_id,
    l.nome as lead_nome,
    th.etapa_anterior,
    th.etapa_nova,
    th.data_mudanca,
    th.observacoes,
    th.ta_order_anterior,
    th.ta_order_nova
  FROM public.ta_historico th
  JOIN public.leads l ON l.id = th.lead_id
  WHERE th.user_id = p_user_id
    AND (p_lead_id IS NULL OR th.lead_id = p_lead_id)
    AND (p_start_date IS NULL OR th.data_mudanca >= p_start_date)
    AND (p_end_date IS NULL OR th.data_mudanca <= p_end_date)
  ORDER BY th.data_mudanca DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp';