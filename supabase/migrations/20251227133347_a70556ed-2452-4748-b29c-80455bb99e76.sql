-- Corrigir o campo etapa_antes_ta dos leads que têm valor incorreto 'TA'
-- Usa o histórico de etapas para encontrar a etapa real antes de ir para TA

UPDATE leads l
SET etapa_antes_ta = h.etapa_anterior
FROM (
  SELECT DISTINCT ON (lead_id) 
    lead_id, 
    etapa_anterior
  FROM historico_etapas_funil
  WHERE etapa_nova = 'TA'
    AND etapa_anterior IS NOT NULL
    AND etapa_anterior != 'TA'
  ORDER BY lead_id, data_mudanca DESC
) h
WHERE l.id = h.lead_id
  AND l.etapa_antes_ta = 'TA'
  AND l.incluir_ta = true;