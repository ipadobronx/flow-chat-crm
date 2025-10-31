-- Correção imediata: Mover leads de "Novo" para "Todos" se estiverem há mais de 15 dias
UPDATE leads 
SET 
  etapa = 'Todos',
  etapa_changed_at = now(),
  updated_at = now()
WHERE 
  etapa = 'Novo' 
  AND etapa_changed_at < (now() - INTERVAL '15 days');

-- Comentário explicativo
COMMENT ON FUNCTION public.move_old_tentativa_leads() IS 'Move automaticamente leads que estão há mais de 15 dias na etapa "Novo" para a etapa "Todos". Executada diariamente via pg_cron às 2:00 AM UTC.';