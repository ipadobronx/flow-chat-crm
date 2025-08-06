-- Adicionar campos para controle de categorização exclusiva
ALTER TABLE leads ADD COLUMN ta_categoria_ativa VARCHAR(20);
ALTER TABLE leads ADD COLUMN ta_categoria_valor TEXT;
ALTER TABLE leads ADD COLUMN ta_exclusividade BOOLEAN DEFAULT false;

-- Criar índice para melhor performance nas consultas TA
CREATE INDEX idx_leads_ta_categoria ON leads(ta_categoria_ativa, ta_categoria_valor, ta_exclusividade);

-- Comentários explicativos
COMMENT ON COLUMN leads.ta_categoria_ativa IS 'Tipo da categoria ativa para TA: etapa ou profissao';
COMMENT ON COLUMN leads.ta_categoria_valor IS 'Valor da categoria ativa (ex: Médico, OI, etc)';
COMMENT ON COLUMN leads.ta_exclusividade IS 'Se o lead foi marcado exclusivamente para uma categoria específica';