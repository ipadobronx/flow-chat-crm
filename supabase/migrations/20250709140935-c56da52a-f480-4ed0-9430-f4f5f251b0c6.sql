-- Criar enum para as etapas do funil
CREATE TYPE public.etapa_funil AS ENUM (
  'Novo',
  'OI', 
  'Delay OI',
  'PC',
  'Delay PC',
  'N',
  'Apólice Emitida',
  'Apólice Entregue',
  'C2',
  'Delay C2',
  'Ligar Depois',
  'Não',
  'Proposta Cancelada',
  'Apólice Cancelada'
);

-- Criar tabela leads estruturada
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa TEXT,
  valor TEXT,
  telefone TEXT,
  profissao TEXT,
  recomendante TEXT,
  etapa etapa_funil NOT NULL DEFAULT 'Novo',
  status TEXT,
  data_callback DATE,
  high_ticket BOOLEAN DEFAULT false,
  casado BOOLEAN DEFAULT false,
  tem_filhos BOOLEAN DEFAULT false,
  avisado BOOLEAN DEFAULT false,
  incluir_sitplan BOOLEAN DEFAULT false,
  observacoes TEXT,
  pa_estimado TEXT,
  data_sitplan DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view their own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns dados de exemplo
INSERT INTO public.leads (nome, empresa, valor, telefone, profissao, recomendante, etapa, status, high_ticket, casado, tem_filhos, observacoes) VALUES
('Geórgia Brito', 'Tech Corp', 'R$ 15.000', '(81)99973-6944', 'Enfermeira', 'Sabrina Medeiros', 'Novo', 'Ligar Depois', true, true, true, 'Enfermeira. Mãe de Valentina.'),
('Jane Smith', 'StartupX', 'R$ 8.500', '(11)98765-4321', 'Designer', 'Maria Silva', 'Novo', 'Aguardando Retorno', false, false, false, 'Interessada em design de interiores.'),
('Bob Johnson', 'BigCo', 'R$ 25.000', '(21)99887-6655', 'Engenheiro', 'Carlos Santos', 'OI', 'Agendado', true, true, true, 'Muito interessado no projeto.'),
('Alice Brown', 'Growth Ltd', 'R$ 12.000', '(31)99123-4567', 'Advogada', 'Ana Costa', 'PC', 'Em Negociação', true, false, false, 'Precisa de mais informações sobre o ROI.'),
('Charlie Wilson', 'Enterprise Inc', 'R$ 45.000', '(41)99456-7890', 'CEO', 'Roberto Lima', 'Apólice Emitida', 'Proposta Enviada', true, true, true, 'Decisor principal da empresa.');