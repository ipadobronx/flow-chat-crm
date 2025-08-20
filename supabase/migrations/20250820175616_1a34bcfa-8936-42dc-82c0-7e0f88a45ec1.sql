
-- Atualizar todos os leads no TA para permitir que apareçam em ambas as categorias
UPDATE leads 
SET 
  ta_exclusividade = false,
  ta_categoria_ativa = null,
  ta_categoria_valor = null,
  updated_at = now()
WHERE incluir_ta = true 
  AND ta_exclusividade = true;
