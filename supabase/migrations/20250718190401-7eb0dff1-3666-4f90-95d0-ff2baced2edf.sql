-- Verificar as etapas atuais e adicionar apenas as que não existem
-- Adicionar "TA" se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TA' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'etapa_funil')) THEN
        ALTER TYPE etapa_funil ADD VALUE 'TA' AFTER 'Novo';
    END IF;
END $$;

-- Adicionar "Não atendido" se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Não atendido' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'etapa_funil')) THEN
        ALTER TYPE etapa_funil ADD VALUE 'Não atendido' AFTER 'TA';
    END IF;
END $$;

-- Adicionar "Marcar" se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Marcar' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'etapa_funil')) THEN
        ALTER TYPE etapa_funil ADD VALUE 'Marcar' AFTER 'Ligar Depois';
    END IF;
END $$;

-- Mudar recomendante para aceitar múltiplos valores (usando array de texto)
ALTER TABLE leads ALTER COLUMN recomendante TYPE text[];

-- Atualizar dados existentes (converter string simples para array)
UPDATE leads SET recomendante = ARRAY[recomendante] WHERE recomendante IS NOT NULL AND recomendante != '';
UPDATE leads SET recomendante = NULL WHERE recomendante = ARRAY[''] OR recomendante = ARRAY[NULL];

-- Criar tabela de histórico de etapas do funil
CREATE TABLE public.historico_etapas_funil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  etapa_anterior etapa_funil,
  etapa_nova etapa_funil NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_mudanca TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de histórico
ALTER TABLE public.historico_etapas_funil ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para histórico
CREATE POLICY "Users can view their own etapa history" 
ON public.historico_etapas_funil 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own etapa history" 
ON public.historico_etapas_funil 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar função para registrar mudanças de etapa automaticamente
CREATE OR REPLACE FUNCTION public.registrar_mudanca_etapa()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se a etapa realmente mudou
  IF OLD.etapa IS DISTINCT FROM NEW.etapa THEN
    INSERT INTO public.historico_etapas_funil (
      lead_id, 
      etapa_anterior, 
      etapa_nova, 
      user_id,
      observacoes
    )
    VALUES (
      NEW.id, 
      OLD.etapa, 
      NEW.etapa, 
      NEW.user_id,
      'Mudança automática via sistema'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para registrar mudanças de etapa
CREATE TRIGGER trigger_registrar_mudanca_etapa
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_mudanca_etapa();

-- Atualizar função para mudar de 30 para 15 dias
CREATE OR REPLACE FUNCTION public.move_old_tentativa_leads()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE leads 
  SET 
    etapa = 'Todos',
    etapa_changed_at = now(),
    updated_at = now()
  WHERE 
    etapa = 'Novo' 
    AND etapa_changed_at < (now() - INTERVAL '15 days');
END;
$function$;