-- Criar perfil para o usuário existente abn3t0@gmail.com
INSERT INTO public.profiles (user_id, email, display_name) 
VALUES (
  '9ccaee68-f59b-4290-9020-661ccd9b6827',
  'abn3t0@gmail.com', 
  'Admin'
) 
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name;