-- Adicionar campos faltantes na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS celular_secundario TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS idade INTEGER,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS renda_estimada TEXT;