-- Remover o constraint antigo que não inclui NAO_TEM_INTERESSE
ALTER TABLE public.ta_actions 
DROP CONSTRAINT IF EXISTS ta_actions_etapa_check;

-- Adicionar novo constraint incluindo NAO_TEM_INTERESSE
ALTER TABLE public.ta_actions 
ADD CONSTRAINT ta_actions_etapa_check 
CHECK (etapa = ANY (ARRAY[
  'NAO_ATENDIDO'::text, 
  'LIGAR_DEPOIS'::text, 
  'MARCAR'::text, 
  'OI'::text,
  'NAO_TEM_INTERESSE'::text
]));