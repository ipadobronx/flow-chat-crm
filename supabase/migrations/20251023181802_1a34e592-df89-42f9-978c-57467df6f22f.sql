-- Create optimized RPC function for weekly recs statistics
CREATE OR REPLACE FUNCTION public.get_weekly_recs_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  week_start DATE,
  week_label TEXT,
  recs_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH weeks AS (
    SELECT 
      generate_series(
        date_trunc('week', p_start_date::timestamp) + interval '1 day',
        date_trunc('week', p_end_date::timestamp) + interval '1 day',
        '1 week'::interval
      )::date as week_start
  ),
  weekly_counts AS (
    SELECT 
      (date_trunc('week', l.created_at) + interval '1 day')::date as week_start,
      COUNT(*) as recs_count
    FROM public.leads l
    WHERE l.user_id = p_user_id
      AND l.created_at >= p_start_date::timestamp
      AND l.created_at <= (p_end_date::timestamp + interval '1 day' - interval '1 second')
    GROUP BY date_trunc('week', l.created_at)
  )
  SELECT 
    w.week_start,
    TO_CHAR(w.week_start, 'DD/MM') as week_label,
    COALESCE(wc.recs_count, 0) as recs_count
  FROM weeks w
  LEFT JOIN weekly_counts wc ON w.week_start = wc.week_start
  ORDER BY w.week_start;
END;
$$;