-- Adicionar coluna para armazenar ligações "Não Tem Interesse" na tabela ta_relatorios
ALTER TABLE public.ta_relatorios 
ADD COLUMN IF NOT EXISTS ligacoes_nao_tem_interesse integer NOT NULL DEFAULT 0;

-- Remover a função antiga antes de recriá-la com nova estrutura
DROP FUNCTION IF EXISTS public.get_ta_dashboard(uuid, text);

-- Criar a função get_ta_dashboard com suporte para "Não Tem Interesse"
CREATE OR REPLACE FUNCTION public.get_ta_dashboard(p_user_id uuid, p_period text DEFAULT '7 days'::text)
 RETURNS TABLE(
   total_contactados bigint, 
   nao_atendeu bigint, 
   ligar_depois bigint, 
   marcar_whatsapp bigint, 
   agendados bigint,
   nao_tem_interesse bigint
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT
  COUNT(*) as total_contactados,
  COUNT(*) FILTER (WHERE etapa = 'NAO_ATENDIDO') as nao_atendeu,
  COUNT(*) FILTER (WHERE etapa = 'LIGAR_DEPOIS') as ligar_depois,
  COUNT(*) FILTER (WHERE etapa = 'MARCAR') as marcar_whatsapp,
  COUNT(*) FILTER (WHERE etapa = 'OI') as agendados,
  COUNT(*) FILTER (WHERE etapa = 'NAO_TEM_INTERESSE') as nao_tem_interesse
FROM public.ta_actions
WHERE user_id = p_user_id
  AND created_at >= now() - CAST(p_period AS INTERVAL);
$function$;