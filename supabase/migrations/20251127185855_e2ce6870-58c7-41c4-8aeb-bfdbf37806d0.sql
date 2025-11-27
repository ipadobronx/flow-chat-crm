-- Adicionar coluna para armazenar o ID da tarefa do Google Tasks
ALTER TABLE public.agendamentos_ligacoes 
ADD COLUMN IF NOT EXISTS google_task_id TEXT DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.agendamentos_ligacoes.google_task_id IS 'ID da tarefa correspondente no Google Tasks';