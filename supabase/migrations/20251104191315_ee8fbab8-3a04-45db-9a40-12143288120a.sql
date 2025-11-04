-- Adicionar coluna etapa_antes_ta à tabela leads
ALTER TABLE public.leads 
ADD COLUMN etapa_antes_ta etapa_funil NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.leads.etapa_antes_ta IS 'Armazena a etapa original do lead antes de ser movido para TA, usado para agrupamento';

-- Popular dados históricos (leads que já estão em TA)
UPDATE public.leads 
SET etapa_antes_ta = etapa 
WHERE etapa = 'TA' AND etapa_antes_ta IS NULL;