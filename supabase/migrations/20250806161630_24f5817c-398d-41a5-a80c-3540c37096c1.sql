-- Fix security issue: Update function with proper search_path
CREATE OR REPLACE FUNCTION public.registrar_tempo_etapa()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;