-- Deletar leads da importação de hoje do usuário específico
DELETE FROM public.leads 
WHERE user_id = 'eeed7c61-c2f0-4a5b-854a-bfa1402b702c' 
AND DATE(created_at) = CURRENT_DATE;