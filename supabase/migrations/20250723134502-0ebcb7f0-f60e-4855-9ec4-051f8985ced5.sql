-- Solução final para o erro Security Definer View
-- Recriar a view atrasos_calculados garantindo que não tenha SECURITY DEFINER

-- 1. Dropar e recriar a view
DROP VIEW IF EXISTS public.atrasos_calculados CASCADE;

-- 2. Recriar sem qualquer referência a SECURITY
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
  public.calcular_dias_atraso("Vencido Em") AS dias_atraso_calculado
FROM public.atrasos;

-- 3. Habilitar RLS na view (se necessário)
-- Views herdam as políticas da tabela base, então não precisamos de RLS separado

-- 4. Verificar se a função calcular_dias_atraso está como SECURITY INVOKER
ALTER FUNCTION public.calcular_dias_atraso(text) SECURITY INVOKER;