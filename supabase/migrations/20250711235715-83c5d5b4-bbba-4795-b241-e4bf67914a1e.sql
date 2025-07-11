-- Adicionar nova etapa "Tentativa" entre "Novo" e "OI"
-- Primeiro, vamos alterar o enum para incluir a nova etapa
ALTER TYPE etapa_funil ADD VALUE 'Tentativa' BEFORE 'OI';

-- Adicionar coluna para rastrear quando o lead foi movido para cada etapa
ALTER TABLE leads ADD COLUMN etapa_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Atualizar leads existentes com timestamp atual
UPDATE leads SET etapa_changed_at = updated_at WHERE etapa_changed_at IS NULL;

-- Criar trigger para atualizar etapa_changed_at quando a etapa mudar
CREATE OR REPLACE FUNCTION update_etapa_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualiza se a etapa realmente mudou
  IF OLD.etapa IS DISTINCT FROM NEW.etapa THEN
    NEW.etapa_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa antes do update
CREATE TRIGGER trigger_update_etapa_changed_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_etapa_changed_at();

-- Criar função para mover leads antigos de "Tentativa" para "Novo"
CREATE OR REPLACE FUNCTION move_old_tentativa_leads()
RETURNS void AS $$
BEGIN
  UPDATE leads 
  SET 
    etapa = 'Novo',
    etapa_changed_at = now(),
    updated_at = now()
  WHERE 
    etapa = 'Tentativa' 
    AND etapa_changed_at < (now() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;