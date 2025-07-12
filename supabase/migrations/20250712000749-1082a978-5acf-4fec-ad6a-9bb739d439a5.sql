-- Criar tabela para histórico de ligações
CREATE TABLE public.ligacoes_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
  data_ligacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ligacoes_historico ENABLE ROW LEVEL SECURITY;

-- Criar políticas de RLS
CREATE POLICY "Usuários podem ver seu próprio histórico de ligações" 
ON public.ligacoes_historico 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias ligações" 
ON public.ligacoes_historico 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias ligações" 
ON public.ligacoes_historico 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_ligacoes_historico_lead_id ON public.ligacoes_historico(lead_id);
CREATE INDEX idx_ligacoes_historico_user_id ON public.ligacoes_historico(user_id);
CREATE INDEX idx_ligacoes_historico_data ON public.ligacoes_historico(data_ligacao DESC);