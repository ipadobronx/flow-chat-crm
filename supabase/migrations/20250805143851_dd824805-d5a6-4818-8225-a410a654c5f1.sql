-- Deletar leads da importação de hoje para permitir reimportação com números corretos
DELETE FROM public.leads 
WHERE DATE(created_at) = CURRENT_DATE;