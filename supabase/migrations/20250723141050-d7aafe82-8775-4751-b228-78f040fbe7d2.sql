-- Corrigir problemas de segurança sem usar materialized view

-- 1. Habilitar RLS na tabela test
ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;

-- 2. Política restritiva para tabela test
CREATE POLICY "Deny all access to test table" 
ON public.test 
FOR ALL 
USING (false);

-- 3. Garantir que user_id é obrigatório em leads
UPDATE public.leads SET user_id = '9ccaee68-f59b-4290-9020-661ccd9b6827' WHERE user_id IS NULL;
ALTER TABLE public.leads ALTER COLUMN user_id SET NOT NULL;

-- 4. Garantir que user_id é obrigatório em agendamentos_ligacoes  
UPDATE public.agendamentos_ligacoes SET user_id = '9ccaee68-f59b-4290-9020-661ccd9b6827' WHERE user_id IS NULL;
ALTER TABLE public.agendamentos_ligacoes ALTER COLUMN user_id SET NOT NULL;

-- 5. Garantir que user_id é obrigatório em ligacoes_historico
UPDATE public.ligacoes_historico SET user_id = '9ccaee68-f59b-4290-9020-661ccd9b6827' WHERE user_id IS NULL;
ALTER TABLE public.ligacoes_historico ALTER COLUMN user_id SET NOT NULL;

-- 6. Garantir que user_id é obrigatório em profiles
UPDATE public.profiles SET user_id = '9ccaee68-f59b-4290-9020-661ccd9b6827' WHERE user_id IS NULL;
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;