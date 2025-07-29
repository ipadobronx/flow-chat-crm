-- Fix security issues in database functions by adding search_path protection
-- This prevents search path manipulation attacks

-- Update the move_old_tentativa_leads function with proper search_path
CREATE OR REPLACE FUNCTION public.move_old_tentativa_leads()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE leads 
  SET 
    etapa = 'Todos',
    etapa_changed_at = now(),
    updated_at = now()
  WHERE 
    etapa = 'Novo' 
    AND etapa_changed_at < (now() - INTERVAL '15 days');
END;
$function$;

-- Update the update_etapa_changed_at function with proper search_path
CREATE OR REPLACE FUNCTION public.update_etapa_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Só atualiza se a etapa realmente mudou
  IF OLD.etapa IS DISTINCT FROM NEW.etapa THEN
    NEW.etapa_changed_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- Update the registrar_mudanca_etapa function with proper search_path
CREATE OR REPLACE FUNCTION public.registrar_mudanca_etapa()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Só registra se a etapa realmente mudou
  IF OLD.etapa IS DISTINCT FROM NEW.etapa THEN
    INSERT INTO public.historico_etapas_funil (
      lead_id, 
      etapa_anterior, 
      etapa_nova, 
      user_id,
      observacoes
    )
    VALUES (
      NEW.id, 
      OLD.etapa, 
      NEW.etapa, 
      NEW.user_id,
      'Mudança automática via sistema'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Update the calcular_dias_atraso function with proper search_path
CREATE OR REPLACE FUNCTION public.calcular_dias_atraso(data_vencimento text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $function$
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
$function$;

-- Update the get_leads_with_metrics function with proper search_path
CREATE OR REPLACE FUNCTION public.get_leads_with_metrics(p_user_id uuid, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(total_leads bigint, leads_atendidos bigint, oi_marcados bigint, virou_pc bigint, virou_n bigint, recomendacoes bigint)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
  SELECT 
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE etapa NOT IN ('Todos', 'Ligar Depois', 'Novo')) as leads_atendidos,
    COUNT(*) FILTER (WHERE etapa IN ('OI', 'Delay OI')) as oi_marcados,
    COUNT(*) FILTER (WHERE etapa IN ('PC', 'Delay PC')) as virou_pc,
    COUNT(*) FILTER (WHERE etapa IN ('N', 'Não')) as virou_n,
    COUNT(*) FILTER (WHERE recomendante IS NOT NULL AND array_length(recomendante, 1) > 0) as recomendacoes
  FROM public.leads 
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
$function$;

-- Update the get_birthday_leads function with proper search_path
CREATE OR REPLACE FUNCTION public.get_birthday_leads(p_user_id uuid, p_data date DEFAULT CURRENT_DATE)
RETURNS TABLE(id uuid, nome text, data_nascimento date, telefone text, idade integer)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
  SELECT 
    l.id,
    l.nome,
    l.data_nascimento,
    l.telefone,
    (DATE_PART('year', p_data) - DATE_PART('year', l.data_nascimento))::integer as idade
  FROM public.leads l
  WHERE l.user_id = p_user_id
    AND l.data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM l.data_nascimento) = EXTRACT(MONTH FROM p_data)
    AND EXTRACT(DAY FROM l.data_nascimento) = EXTRACT(DAY FROM p_data)
  ORDER BY l.nome;
$function$;

-- Update the get_scheduled_calls function with proper search_path
CREATE OR REPLACE FUNCTION public.get_scheduled_calls(p_user_id uuid, p_data date DEFAULT CURRENT_DATE)
RETURNS TABLE(id uuid, data_agendamento timestamp with time zone, observacoes text, status text, lead_id uuid, lead_nome text, lead_telefone text)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
  SELECT 
    a.id,
    a.data_agendamento,
    a.observacoes,
    a.status,
    a.lead_id,
    l.nome as lead_nome,
    l.telefone as lead_telefone
  FROM public.agendamentos_ligacoes a
  JOIN public.leads l ON l.id = a.lead_id
  WHERE a.user_id = p_user_id
    AND DATE(a.data_agendamento) = p_data
  ORDER BY a.data_agendamento;
$function$;

-- Update the handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

-- Update the update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;