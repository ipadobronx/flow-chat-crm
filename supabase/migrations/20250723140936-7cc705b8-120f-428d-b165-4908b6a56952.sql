-- Habilitar RLS e criar políticas para tabelas que faltam

-- 1. Tabela historico_etapas_funil já tem RLS mas vamos garantir que está protegida
-- (já verificada - está OK)

-- 2. Tabela ligacoes_historico já tem RLS e políticas - está OK

-- 3. Tabela test - precisa de RLS se contém dados sensíveis
ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;

-- Como não sei se a tabela test tem user_id, vou criar uma política restritiva
CREATE POLICY "Deny all access to test table" 
ON public.test 
FOR ALL 
USING (false);

-- 4. Atrasos e atrasos_calculados já tem políticas básicas

-- 5. Corrigir o problema da view atrasos_calculados
DROP VIEW IF EXISTS public.atrasos_calculados;

-- Recriar como tabela materializada para evitar problemas de SECURITY DEFINER
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
  CASE 
    WHEN "Vencido Em" IS NULL OR "Vencido Em" = '' THEN 0
    ELSE GREATEST(0, (CURRENT_DATE - "Vencido Em"::date))
  END AS dias_atraso_calculado
FROM public.atrasos;

-- Habilitar RLS na materialized view
ALTER MATERIALIZED VIEW public.atrasos_calculados ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de atrasos para usuários autenticados
CREATE POLICY "Permitir leitura de atrasos calculados para usuários autenticados" 
ON public.atrasos_calculados 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 6. Garantir que a tabela leads está segura (user_id obrigatório)
ALTER TABLE public.leads ALTER COLUMN user_id SET NOT NULL;