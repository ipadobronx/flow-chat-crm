-- Update enum values for etapa_funil
-- First, update existing data to use new values
UPDATE leads SET etapa = 'Todos' WHERE etapa = 'Novo';
UPDATE leads SET etapa = 'Novo' WHERE etapa = 'Tentativa';

-- Drop and recreate the enum with new values
DROP TYPE IF EXISTS etapa_funil CASCADE;
CREATE TYPE etapa_funil AS ENUM (
  'Todos',
  'Novo', 
  'OI',
  'Delay OI',
  'PC',
  'Delay PC',
  'N',
  'Apólice Emitida',
  'Apólice Entregue',
  'C2',
  'Delay C2',
  'Ligar Depois',
  'Não',
  'Proposta Cancelada',
  'Apólice Cancelada'
);

-- Re-add the column with the new enum type
ALTER TABLE leads ALTER COLUMN etapa TYPE etapa_funil USING etapa::text::etapa_funil;
ALTER TABLE leads ALTER COLUMN etapa SET DEFAULT 'Todos'::etapa_funil;

-- Update the function to move from 'Novo' to 'Todos' (since Novo is now the second stage)
CREATE OR REPLACE FUNCTION public.move_old_tentativa_leads()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE leads 
  SET 
    etapa = 'Todos',
    etapa_changed_at = now(),
    updated_at = now()
  WHERE 
    etapa = 'Novo' 
    AND etapa_changed_at < (now() - INTERVAL '30 days');
END;
$function$;