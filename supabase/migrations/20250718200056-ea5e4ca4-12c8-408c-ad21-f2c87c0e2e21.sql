-- Adicionar coluna quantidade_filhos na tabela leads
ALTER TABLE public.leads 
ADD COLUMN quantidade_filhos integer DEFAULT NULL;

-- Criar tabela para agendamentos de ligações
CREATE TABLE public.agendamentos_ligacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  observacoes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agendamentos_ligacoes ENABLE ROW LEVEL SECURITY;

-- Create policies for agendamentos
CREATE POLICY "Users can view their own agendamentos" 
ON public.agendamentos_ligacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agendamentos" 
ON public.agendamentos_ligacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agendamentos" 
ON public.agendamentos_ligacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agendamentos" 
ON public.agendamentos_ligacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agendamentos_ligacoes_updated_at
BEFORE UPDATE ON public.agendamentos_ligacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();