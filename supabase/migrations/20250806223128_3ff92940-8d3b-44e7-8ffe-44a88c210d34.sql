-- Criar tabela para relatórios de TA
CREATE TABLE public.ta_relatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_relatorio DATE NOT NULL,
  periodo_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  periodo_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  total_leads INTEGER NOT NULL DEFAULT 0,
  total_ligacoes INTEGER NOT NULL DEFAULT 0,
  ligacoes_atendidas INTEGER NOT NULL DEFAULT 0,
  ligacoes_nao_atendidas INTEGER NOT NULL DEFAULT 0,
  ligacoes_ligar_depois INTEGER NOT NULL DEFAULT 0,
  ligacoes_agendadas INTEGER NOT NULL DEFAULT 0,
  ligacoes_marcadas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ta_relatorios ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view their own TA reports" 
ON public.ta_relatorios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own TA reports" 
ON public.ta_relatorios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TA reports" 
ON public.ta_relatorios 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Adicionar campo status na tabela ta_historico
ALTER TABLE public.ta_historico 
ADD COLUMN status TEXT;

-- Criar índices para performance
CREATE INDEX idx_ta_relatorios_user_data ON public.ta_relatorios(user_id, data_relatorio);
CREATE INDEX idx_ta_historico_status ON public.ta_historico(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ta_relatorios_updated_at
BEFORE UPDATE ON public.ta_relatorios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();