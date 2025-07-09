-- Atualizar os leads existentes para ter o user_id do usuário atual
UPDATE public.leads 
SET user_id = '9ccaee68-f59b-4290-9020-661ccd9b6827' 
WHERE user_id IS NULL;