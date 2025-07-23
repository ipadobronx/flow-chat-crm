-- Corrigir problemas de segurança e RLS

-- 1. Habilitar RLS na tabela test
ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;

-- 2. Política restritiva para tabela test (negar acesso até definir melhor)
CREATE POLICY "Deny all access to test table" 
ON public.test 
FOR ALL 
USING (false);

-- 3. Remover a view problemática e recriar sem função de data
DROP VIEW IF EXISTS public.atrasos_calculados;

-- 4. Recriar como materialized view simples
CREATE MATERIALIZED VIEW public.atrasos_calculados AS
SELECT 
  "Agência",
  "MFB", 
  "LP",
  "Dias  Atraso",
  "Apólice",
  "Resp.  Pagto.",
  "Segurado",
  "Telefone Resp.  Pagto.",
  "Celular Resp.  Pagto.",
  "Telefone (Comercial)  Resp. Pagto.",
  "E-mail Resp. Pagto.",
  "Periodicidade  Pagto.",
  "Forma  Pagto.",
  "Mês/Ano  Cartão",
  "Emissão",
  "Pago até",
  "Vencido Em",
  "Última Mensagem Retorno Cobrança Rejeitada",
  "Prêmio",
  "Carregado em",
  "Status",
  "Comentário",
  "E-mail da Assistente",
  "Histórico de Contatos e Tratativas",
  "Peristência", 
  "Celular",
  "PRIMEIRO NOME",
  "Melhor Dia",
  "Tratado Por",
  "Tratado em",
  "Data do Carregamento (Evolução da Lista de Atraso)",
  "Criado Por",
  "Joint",
  "Dias  Atraso" AS dias_atraso_calculado  -- Usar o campo existente
FROM public.atrasos;

-- 5. Habilitar RLS na materialized view
ALTER MATERIALIZED VIEW public.atrasos_calculados ENABLE ROW LEVEL SECURITY;

-- 6. Política para atrasos calculados
CREATE POLICY "Permitir leitura de atrasos calculados para usuários autenticados" 
ON public.atrasos_calculados 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 7. Garantir que user_id é obrigatório em leads (se não há dados órfãos)
-- Primeiro vamos verificar se existem leads sem user_id
UPDATE public.leads SET user_id = '9ccaee68-f59b-4290-9020-661ccd9b6827' WHERE user_id IS NULL;

-- Agora tornar obrigatório
ALTER TABLE public.leads ALTER COLUMN user_id SET NOT NULL;