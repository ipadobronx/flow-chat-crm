-- Identificar e corrigir todas as views com SECURITY DEFINER
-- Primeiro, vamos recriar todas as views que podem ter esse problema

-- Dropar e recriar a view atrasos_calculados sem SECURITY DEFINER
DROP VIEW IF EXISTS public.atrasos_calculados CASCADE;

-- Recriar a view atrasos_calculados
CREATE VIEW public.atrasos_calculados AS
SELECT 
  *,
  public.calcular_dias_atraso("Vencido Em") as dias_atraso_calculado
FROM public.atrasos;

-- Verificar se há outras views problemáticas e corrigi-las
-- Vamos também verificar as permissões da função calcular_dias_atraso
ALTER FUNCTION public.calcular_dias_atraso(text) SECURITY INVOKER;