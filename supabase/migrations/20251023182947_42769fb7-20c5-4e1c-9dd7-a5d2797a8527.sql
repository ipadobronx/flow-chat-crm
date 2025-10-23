-- Add google_event_id column to track Google Calendar events
ALTER TABLE agendamentos_ligacoes 
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Create index for better performance when looking up by Google event ID
CREATE INDEX IF NOT EXISTS idx_agendamentos_google_event_id 
ON agendamentos_ligacoes(google_event_id) 
WHERE google_event_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN agendamentos_ligacoes.google_event_id IS 'Google Calendar Event ID for bidirectional sync';