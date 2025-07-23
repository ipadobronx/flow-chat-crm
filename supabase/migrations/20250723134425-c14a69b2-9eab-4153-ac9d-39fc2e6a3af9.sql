-- Corrigir todas as funções SECURITY DEFINER para SECURITY INVOKER
-- para resolver o erro de publicação

-- Alterar função get_leads_with_metrics
ALTER FUNCTION public.get_leads_with_metrics(uuid, timestamp with time zone, timestamp with time zone) SECURITY INVOKER;

-- Alterar função get_birthday_leads
ALTER FUNCTION public.get_birthday_leads(uuid, date) SECURITY INVOKER;

-- Alterar função get_scheduled_calls
ALTER FUNCTION public.get_scheduled_calls(uuid, date) SECURITY INVOKER;