-- Create new enum with updated values
CREATE TYPE etapa_funil_new AS ENUM (
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

-- Add a temporary column with the new enum type
ALTER TABLE leads ADD COLUMN etapa_new etapa_funil_new;

-- Map old values to new values
UPDATE leads SET etapa_new = 
  CASE 
    WHEN etapa = 'Novo' THEN 'Todos'::etapa_funil_new
    WHEN etapa = 'Tentativa' THEN 'Novo'::etapa_funil_new
    ELSE etapa::text::etapa_funil_new
  END;

-- Drop the old column and rename the new one
ALTER TABLE leads DROP COLUMN etapa;
ALTER TABLE leads RENAME COLUMN etapa_new TO etapa;

-- Set the default value
ALTER TABLE leads ALTER COLUMN etapa SET DEFAULT 'Todos'::etapa_funil_new;
ALTER TABLE leads ALTER COLUMN etapa SET NOT NULL;

-- Drop the old enum and rename the new one
DROP TYPE etapa_funil;
ALTER TYPE etapa_funil_new RENAME TO etapa_funil;

-- Update the function to move from 'Novo' to 'Todos'
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