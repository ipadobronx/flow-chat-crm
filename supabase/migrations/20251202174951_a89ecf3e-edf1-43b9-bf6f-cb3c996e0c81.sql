-- Parte 1: Adicionar "Persistência" ao enum e novas colunas
-- O UPDATE será feito manualmente depois

ALTER TYPE etapa_funil ADD VALUE IF NOT EXISTS 'Persistência';

-- Adicionar novas colunas para follow-up de clientes com apólice emitida
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nome_esposa TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nome_filhos TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_nascimento_filhos TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_emissao_apolice DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pa_valor TEXT;