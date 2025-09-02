-- Limpar todos os dados TA para permitir novo teste
-- Esta operação remove todos os registros de ações TA e relatórios

-- Limpar tabela de ações individuais do TA
DELETE FROM public.ta_actions;

-- Limpar tabela de relatórios finalizados do TA  
DELETE FROM public.ta_relatorios;

-- Limpar histórico de mudanças do TA
DELETE FROM public.ta_historico;