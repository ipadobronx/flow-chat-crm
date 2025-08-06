-- Adicionar coluna para rastrear dias na etapa atual na tabela leads
ALTER TABLE public.leads 
ADD COLUMN dias_na_etapa_atual INTEGER DEFAULT 1;

-- Criar tabela para histórico de tempo em cada etapa
CREATE TABLE public.tempo_etapas_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  user_id UUID NOT NULL,
  etapa etapa_funil NOT NULL,
  data_entrada TIMESTAMP WITH TIME ZONE NOT NULL,
  data_saida TIMESTAMP WITH TIME ZONE,
  dias_na_etapa INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tempo_etapas_historico ENABLE ROW LEVEL SECURITY;

-- Create policies for tempo_etapas_historico
CREATE POLICY "Users can view their own tempo etapas historico" 
ON public.tempo_etapas_historico 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tempo etapas historico" 
ON public.tempo_etapas_historico 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tempo etapas historico" 
ON public.tempo_etapas_historico 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to calculate and record stage time when etapa changes
CREATE OR REPLACE FUNCTION public.registrar_tempo_etapa()
RETURNS TRIGGER AS $$
DECLARE
  dias_anteriores INTEGER;
BEGIN
  -- Só registra se a etapa realmente mudou
  IF OLD.etapa IS DISTINCT FROM NEW.etapa THEN
    -- Calcular dias na etapa anterior
    dias_anteriores := GREATEST(1, (CURRENT_DATE - OLD.etapa_changed_at::date));
    
    -- Finalizar o registro anterior (se existir)
    UPDATE public.tempo_etapas_historico 
    SET 
      data_saida = now(),
      dias_na_etapa = dias_anteriores,
      updated_at = now()
    WHERE lead_id = NEW.id 
      AND etapa = OLD.etapa 
      AND data_saida IS NULL;
    
    -- Criar novo registro para a nova etapa
    INSERT INTO public.tempo_etapas_historico (
      lead_id, 
      user_id,
      etapa, 
      data_entrada
    )
    VALUES (
      NEW.id, 
      NEW.user_id,
      NEW.etapa, 
      now()
    );
    
    -- Reset dias na etapa atual
    NEW.dias_na_etapa_atual := 1;
  ELSE
    -- Se não mudou etapa, calcular dias na etapa atual
    NEW.dias_na_etapa_atual := GREATEST(1, (CURRENT_DATE - NEW.etapa_changed_at::date) + 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stage time tracking
CREATE TRIGGER track_stage_time
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.registrar_tempo_etapa();

-- Create initial records for existing leads
INSERT INTO public.tempo_etapas_historico (lead_id, user_id, etapa, data_entrada)
SELECT 
  id,
  user_id,
  etapa,
  COALESCE(etapa_changed_at, created_at)
FROM public.leads
ON CONFLICT DO NOTHING;

-- Update dias_na_etapa_atual for existing leads
UPDATE public.leads 
SET dias_na_etapa_atual = GREATEST(1, (CURRENT_DATE - COALESCE(etapa_changed_at, created_at)::date) + 1);

-- Add trigger for updated_at column on tempo_etapas_historico
CREATE TRIGGER update_tempo_etapas_historico_updated_at
BEFORE UPDATE ON public.tempo_etapas_historico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();