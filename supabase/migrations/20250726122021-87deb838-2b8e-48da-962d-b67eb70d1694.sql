-- Adicionar novas etapas ao enum etapa_funil
ALTER TYPE etapa_funil ADD VALUE 'Analisando Proposta';
ALTER TYPE etapa_funil ADD VALUE 'Pendência de UW';
ALTER TYPE etapa_funil ADD VALUE 'Placed';
ALTER TYPE etapa_funil ADD VALUE 'Proposta Não Apresentada';