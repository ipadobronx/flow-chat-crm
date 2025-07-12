-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para executar a função todos os dias às 2:00 AM
-- Isso verificará e moverá leads que estão há mais de 30 dias na etapa "Tentativa"
SELECT cron.schedule(
  'move-old-tentativa-leads-daily',
  '0 2 * * *', -- Todo dia às 2:00 AM
  $$
  SELECT
    net.http_post(
      url := 'https://ltqhujliyocybuwcmadf.supabase.co/functions/v1/move-old-tentativa-leads',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cWh1amxpeW9jeWJ1d2NtYWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjYzMjcsImV4cCI6MjA2NzY0MjMyN30.eaqzmDJnLHErcbiZ7re1bzPL0ztYe28kyhENYA9ZHtw"}'::jsonb,
      body := '{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);