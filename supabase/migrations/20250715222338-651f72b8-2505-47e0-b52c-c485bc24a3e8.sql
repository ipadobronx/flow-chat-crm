-- Habilitar RLS na tabela atrasos se não estiver habilitado
ALTER TABLE public.atrasos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública dos dados de atrasos
-- (assumindo que esta é uma tabela compartilhada entre usuários)
CREATE POLICY "Permitir leitura de atrasos para todos os usuários autenticados" 
ON public.atrasos 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Se preferir acesso público (sem autenticação), use esta política alternativa:
-- CREATE POLICY "Permitir leitura pública de atrasos" 
-- ON public.atrasos 
-- FOR SELECT 
-- USING (true);