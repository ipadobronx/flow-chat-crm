
-- Delete leads from last import for user renato.calumby@prudentialfranquia.com.br
DELETE FROM public.leads 
WHERE user_id = '980820af-7fac-41a5-b617-ca593f5d3e7a'
  AND created_at >= '2025-12-26 14:35:02.565248+00'
  AND created_at <= '2025-12-26 14:35:10.328053+00';
