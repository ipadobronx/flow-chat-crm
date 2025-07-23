-- Corrigir função handle_new_user para ser SECURITY INVOKER
ALTER FUNCTION public.handle_new_user() SECURITY INVOKER;