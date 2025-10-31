-- Criar função para atualizar dias_na_etapa_atual de todos os leads
CREATE OR REPLACE FUNCTION public.update_all_dias_na_etapa()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.leads 
  SET dias_na_etapa_atual = GREATEST(1, (CURRENT_DATE - etapa_changed_at::date) + 1)
  WHERE etapa != 'Todos';
END;
$$;

-- Habilitar extensão pg_cron se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução diária às 00:01 UTC (21:01 horário de Brasília)
SELECT cron.schedule(
  'update-dias-na-etapa-daily',
  '1 0 * * *',
  'SELECT public.update_all_dias_na_etapa()'
);

-- Executar atualização imediata para corrigir dados atuais
SELECT public.update_all_dias_na_etapa();

-- Comentário explicativo
COMMENT ON FUNCTION public.update_all_dias_na_etapa() IS 'Atualiza automaticamente o campo dias_na_etapa_atual para todos os leads baseado em etapa_changed_at. Executada diariamente via pg_cron às 00:01 UTC.';