-- Enable RLS on the backup table
ALTER TABLE google_calendar_tokens_backup ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for the backup table (read-only for debugging)
CREATE POLICY "Admins can view token backup"
ON google_calendar_tokens_backup
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Note: The view google_calendar_tokens_decrypted inherits RLS from the base table google_calendar_tokens
-- No additional RLS policies needed for the view as it's a simple wrapper
-- Users can only see their own decrypted tokens through the view