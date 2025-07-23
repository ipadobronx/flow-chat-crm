-- Corrigir isolamento das tabelas de atrasos por usuário

-- 1. Adicionar coluna user_id na tabela atrasos
ALTER TABLE public.atrasos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Atribuir todos os atrasos existentes ao usuário padrão (você pode ajustar depois)
UPDATE public.atrasos SET user_id = '9ccaee68-f59b-4290-9020-661ccd9b6827' WHERE user_id IS NULL;

-- 3. Tornar user_id obrigatório
ALTER TABLE public.atrasos ALTER COLUMN user_id SET NOT NULL;

-- 4. Remover a política antiga que permitia acesso geral
DROP POLICY IF EXISTS "Permitir leitura de atrasos para todos os usuários autenticado" ON public.atrasos;

-- 5. Criar políticas RLS corretas para atrasos
CREATE POLICY "Users can view their own atrasos" 
ON public.atrasos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own atrasos" 
ON public.atrasos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own atrasos" 
ON public.atrasos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own atrasos" 
ON public.atrasos 
FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Dropar e recriar atrasos_calculados como view simples (sem RLS pois views herdam da tabela base)
DROP MATERIALIZED VIEW IF EXISTS public.atrasos_calculados;

CREATE VIEW public.atrasos_calculados AS
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
  "Dias  Atraso" AS dias_atraso_calculado,
  user_id  -- Incluir user_id na view
FROM public.atrasos;

-- 7. Remover política antiga de atrasos_calculados se existir
DROP POLICY IF EXISTS "Permitir leitura de atrasos calculados para usuários autenticados" ON public.atrasos_calculados;