-- FASE 1: Criar tabela de profissões padronizadas
CREATE TABLE profissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  categoria TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE profissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar profissões ativas"
  ON profissoes FOR SELECT
  USING (ativa = true);

CREATE POLICY "Usuários autenticados podem inserir profissões"
  ON profissoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Popular com profissões padronizadas
INSERT INTO profissoes (nome, categoria) VALUES
  ('Médico(a)', 'Saúde'),
  ('Dentista', 'Saúde'),
  ('Enfermeiro(a)', 'Saúde'),
  ('Fisioterapeuta', 'Saúde'),
  ('Psicólogo(a)', 'Saúde'),
  ('Nutricionista', 'Saúde'),
  ('Farmacêutico(a)', 'Saúde'),
  ('Fonoaudiólogo(a)', 'Saúde'),
  ('Empresário(a)', 'Negócios'),
  ('Advogado(a)', 'Jurídico'),
  ('Engenheiro(a)', 'Engenharia'),
  ('Arquiteto(a)', 'Engenharia'),
  ('Administrador(a)', 'Administração'),
  ('Contador(a)', 'Finanças'),
  ('Economista', 'Finanças'),
  ('Bancário(a)', 'Finanças'),
  ('Corretor(a) de Imóveis', 'Vendas'),
  ('Representante Comercial', 'Vendas'),
  ('Vendedor(a)', 'Vendas'),
  ('Programador(a)', 'Tecnologia'),
  ('Servidor Público', 'Público'),
  ('Professor(a)', 'Educação'),
  ('Personal Trainer', 'Saúde'),
  ('Marketing', 'Marketing'),
  ('Piloto', 'Aviação'),
  ('Fotógrafo(a)', 'Artes'),
  ('Biólogo(a)', 'Ciências'),
  ('Procurador(a)', 'Jurídico'),
  ('Estudante', 'Educação'),
  ('Outro', 'Outros');

-- Índice para busca rápida
CREATE INDEX idx_profissoes_nome ON profissoes(nome);

-- Trigger para updated_at
CREATE TRIGGER update_profissoes_updated_at
  BEFORE UPDATE ON profissoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- FASE 2: Função para normalizar profissões
CREATE OR REPLACE FUNCTION normalizar_profissao(profissao_antiga TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove espaços extras e converte para minúsculas para comparação
  profissao_antiga := TRIM(LOWER(profissao_antiga));
  
  -- Retorna vazio se entrada for vazia
  IF profissao_antiga = '' OR profissao_antiga IS NULL THEN
    RETURN '';
  END IF;
  
  -- Mapeamento de profissões
  CASE
    -- Médicos
    WHEN profissao_antiga IN ('medico', 'médico', 'medica', 'médica') THEN
      RETURN 'Médico(a)';
    
    -- Empresários
    WHEN profissao_antiga IN ('empresario', 'empresário', 'empresaria', 'empresária', 'empreendedor', 'empreendedora') THEN
      RETURN 'Empresário(a)';
    
    -- Advogados
    WHEN profissao_antiga IN ('advogado', 'advogada') THEN
      RETURN 'Advogado(a)';
    
    -- Psicólogos
    WHEN profissao_antiga IN ('psicologo', 'psicólogo', 'psicologa', 'psicóloga') THEN
      RETURN 'Psicólogo(a)';
    
    -- Enfermeiros
    WHEN profissao_antiga IN ('enfermeiro', 'enfermeira') THEN
      RETURN 'Enfermeiro(a)';
    
    -- Contadores
    WHEN profissao_antiga IN ('contador', 'contadora') THEN
      RETURN 'Contador(a)';
    
    -- Engenheiros (incluindo especializações)
    WHEN profissao_antiga LIKE '%engenheir%' THEN
      RETURN 'Engenheiro(a)';
    
    -- Arquitetos
    WHEN profissao_antiga IN ('arquiteto', 'arquiteta') THEN
      RETURN 'Arquiteto(a)';
    
    -- Bancários
    WHEN profissao_antiga IN ('bancario', 'bancário', 'bancaria', 'bancária') THEN
      RETURN 'Bancário(a)';
    
    -- Procuradores
    WHEN profissao_antiga IN ('procurador', 'procuradora', 'procuradoria do estado') THEN
      RETURN 'Procurador(a)';
    
    -- Professores
    WHEN profissao_antiga IN ('professor', 'professora') THEN
      RETURN 'Professor(a)';
    
    -- Fotógrafos
    WHEN profissao_antiga IN ('fotografo', 'fotógrafo', 'fotografa', 'fotógrafa') THEN
      RETURN 'Fotógrafo(a)';
    
    -- Biólogos
    WHEN profissao_antiga IN ('biologo', 'biólogo', 'biologa', 'bióloga') THEN
      RETURN 'Biólogo(a)';
    
    -- Fonoaudiólogos
    WHEN profissao_antiga IN ('fonoaudiologo', 'fonoaudiólogo', 'fonoaudiologa', 'fonoaudióloga') THEN
      RETURN 'Fonoaudiólogo(a)';
    
    -- Farmacêuticos
    WHEN profissao_antiga IN ('farmaceutico', 'farmacêutico', 'farmaceutica', 'farmacêutica') THEN
      RETURN 'Farmacêutico(a)';
    
    -- Servidor Público
    WHEN profissao_antiga LIKE '%servidor%' OR profissao_antiga LIKE '%funcionário público%' OR profissao_antiga LIKE '%funcionario publico%' THEN
      RETURN 'Servidor Público';
    
    -- Corretor de Imóveis
    WHEN profissao_antiga LIKE '%corretor%' THEN
      RETURN 'Corretor(a) de Imóveis';
    
    -- Administradores
    WHEN profissao_antiga IN ('administrador', 'administradora') THEN
      RETURN 'Administrador(a)';
    
    -- Dentistas / Cirurgião Dentista
    WHEN profissao_antiga IN ('dentista', 'cirurgião dentista', 'cirurgia dentista', 'cirurgiao dentista') THEN
      RETURN 'Dentista';
    
    -- Programadores
    WHEN profissao_antiga IN ('programador', 'programadora', 'desenvolvedor', 'desenvolvedora') THEN
      RETURN 'Programador(a)';
    
    -- Estudantes
    WHEN profissao_antiga LIKE '%estudante%' THEN
      RETURN 'Estudante';
    
    -- Vendedores
    WHEN profissao_antiga IN ('vendedor', 'vendedora') THEN
      RETURN 'Vendedor(a)';
    
    -- Fisioterapeutas
    WHEN profissao_antiga IN ('fisioterapeuta', 'fisioterapia') THEN
      RETURN 'Fisioterapeuta';
    
    -- Nutricionistas
    WHEN profissao_antiga IN ('nutricionista', 'nutricao', 'nutrição') THEN
      RETURN 'Nutricionista';
    
    -- Personal Trainer
    WHEN profissao_antiga IN ('personal trainer', 'personal', 'educador fisico', 'educador físico') THEN
      RETURN 'Personal Trainer';
    
    -- Economistas
    WHEN profissao_antiga IN ('economista', 'economia') THEN
      RETURN 'Economista';
    
    -- Marketing
    WHEN profissao_antiga LIKE '%marketing%' THEN
      RETURN 'Marketing';
    
    -- Pilotos
    WHEN profissao_antiga IN ('piloto', 'aviador', 'aviadora') THEN
      RETURN 'Piloto';
    
    -- Representante Comercial
    WHEN profissao_antiga LIKE '%representante%' THEN
      RETURN 'Representante Comercial';
    
    -- Outros casos não mapeados
    ELSE
      RETURN 'Outro';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Atualizar todos os leads com profissões normalizadas
UPDATE leads
SET profissao = normalizar_profissao(profissao)
WHERE profissao IS NOT NULL AND profissao != '';

-- Adicionar comentário
COMMENT ON FUNCTION normalizar_profissao IS 'Normaliza variações de profissões para valores padronizados';