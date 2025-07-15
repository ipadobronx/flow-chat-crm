-- Criar função para calcular automaticamente os dias de atraso
CREATE OR REPLACE FUNCTION public.calcular_dias_atraso(data_vencimento text)
RETURNS integer AS $$
BEGIN
  -- Se a data de vencimento for nula ou vazia, retorna 0
  IF data_vencimento IS NULL OR data_vencimento = '' THEN
    RETURN 0;
  END IF;
  
  -- Tenta converter a string para data e calcular a diferença
  BEGIN
    RETURN GREATEST(0, (CURRENT_DATE - data_vencimento::date));
  EXCEPTION
    WHEN OTHERS THEN
      -- Se não conseguir converter, tenta outros formatos comuns
      BEGIN
        -- Formato DD/MM/YYYY
        RETURN GREATEST(0, (CURRENT_DATE - to_date(data_vencimento, 'DD/MM/YYYY')));
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 0;
      END;
  END;
END;
$$ LANGUAGE plpgsql STABLE;

-- Criar view que calcula automaticamente os dias de atraso
CREATE OR REPLACE VIEW public.atrasos_calculados AS
SELECT 
  *,
  -- Substitui a coluna "Dias  Atraso" pelo cálculo automático
  public.calcular_dias_atraso("Vencido Em") as dias_atraso_calculado
FROM public.atrasos;