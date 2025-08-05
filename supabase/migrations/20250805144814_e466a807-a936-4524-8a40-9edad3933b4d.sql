-- Deletar todos os leads da importação de hoje para permitir nova reimportação
DELETE FROM public.leads 
WHERE DATE(created_at) = CURRENT_DATE;