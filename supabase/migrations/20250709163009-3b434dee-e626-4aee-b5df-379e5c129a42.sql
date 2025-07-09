-- Primeiro, limpar dados de exemplo da tabela leads
DELETE FROM public.leads;

-- Migrar dados da tabela test para leads
INSERT INTO public.leads (
  user_id,
  nome,
  telefone,
  profissao,
  recomendante,
  etapa,
  status,
  observacoes,
  pa_estimado,
  high_ticket,
  casado,
  tem_filhos,
  empresa,
  valor
)
SELECT 
  '9ccaee68-f59b-4290-9020-661ccd9b6827' as user_id,
  "Nome" as nome,
  "Celular" as telefone,
  "Profissão" as profissao,
  "Recomendante" as recomendante,
  CASE 
    WHEN "Etapa Funil" = 'NOVO' THEN 'Novo'::etapa_funil
    WHEN "Etapa Funil" = 'OI' THEN 'OI'::etapa_funil
    WHEN "Etapa Funil" = 'PC' THEN 'PC'::etapa_funil
    WHEN "Etapa Funil" = 'N' THEN 'N'::etapa_funil
    ELSE 'Novo'::etapa_funil
  END as etapa,
  "Status" as status,
  "Observações" as observacoes,
  "PA Estimado" as pa_estimado,
  CASE WHEN "HighTicket" = 'Y' THEN true ELSE false END as high_ticket,
  CASE WHEN "Casado(a)" = 'Y' THEN true ELSE false END as casado,
  CASE WHEN "Filhos" = 'Y' THEN true ELSE false END as tem_filhos,
  NULL as empresa, -- Não há campo equivalente na tabela test
  NULL as valor     -- Não há campo equivalente na tabela test
FROM test
WHERE "Nome" IS NOT NULL;