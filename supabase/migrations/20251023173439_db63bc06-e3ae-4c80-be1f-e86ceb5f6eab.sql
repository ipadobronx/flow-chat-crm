-- Função para buscar agendamentos do dia
CREATE OR REPLACE FUNCTION public.get_scheduled_calls_for_today(
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  id uuid,
  lead_id uuid,
  lead_nome text,
  lead_telefone text,
  data_agendamento timestamp with time zone,
  observacoes text,
  synced_with_google boolean,
  horario text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.lead_id,
    l.nome as lead_nome,
    l.telefone as lead_telefone,
    a.data_agendamento,
    a.observacoes,
    a.synced_with_google,
    TO_CHAR(a.data_agendamento, 'HH24:MI') as horario
  FROM public.agendamentos_ligacoes a
  JOIN public.leads l ON l.id = a.lead_id
  WHERE a.user_id = p_user_id
    AND DATE(a.data_agendamento) = p_date
    AND a.status = 'pendente'
  ORDER BY a.data_agendamento ASC;
END;
$$;