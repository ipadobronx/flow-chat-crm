-- Remove a versão antiga da função que causa ambiguidade
-- Mantém apenas a versão que aceita TEXT e faz conversão correta de fuso horário
DROP FUNCTION IF EXISTS public.get_scheduled_calls_for_today(uuid, date);

-- A versão correta que aceita TEXT (p_user_id uuid, p_date text) já existe
-- e faz a conversão correta para 'America/Sao_Paulo' timezone