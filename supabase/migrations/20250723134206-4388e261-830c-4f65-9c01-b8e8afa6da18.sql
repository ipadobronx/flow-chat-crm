-- Corrigir definitivamente o erro Security Definer View na view atrasos_calculados
-- Primeiro remover a view existente
DROP VIEW IF EXISTS public.atrasos_calculados;

-- Recriar a view sem SECURITY DEFINER
CREATE VIEW public.atrasos_calculados AS
SELECT 
  *,
  public.calcular_dias_atraso("Vencido Em") as dias_atraso_calculado
FROM public.atrasos;