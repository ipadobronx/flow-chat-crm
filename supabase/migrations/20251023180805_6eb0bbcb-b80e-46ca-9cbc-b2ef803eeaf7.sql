-- Create or replace function to get scheduled calls with proper timezone handling
CREATE OR REPLACE FUNCTION get_scheduled_calls_for_today(
  p_user_id UUID,
  p_date TEXT
)
RETURNS TABLE (
  id UUID,
  lead_id UUID,
  lead_nome TEXT,
  lead_telefone TEXT,
  recomendante TEXT[],
  data_agendamento TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  synced_with_google BOOLEAN,
  horario TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    l.id as lead_id,
    l.nome as lead_nome,
    l.telefone as lead_telefone,
    l.recomendante,
    al.data_agendamento,
    al.observacoes,
    al.synced_with_google,
    TO_CHAR(al.data_agendamento AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') as horario
  FROM agendamentos_ligacoes al
  JOIN leads l ON al.lead_id = l.id
  WHERE l.user_id = p_user_id
  AND DATE(al.data_agendamento AT TIME ZONE 'America/Sao_Paulo') = p_date::DATE
  AND al.status = 'pendente'
  ORDER BY al.data_agendamento;
END;
$$;