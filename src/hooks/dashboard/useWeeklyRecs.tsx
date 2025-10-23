import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeeklyData {
  week: string;
  recs: number;
  weekStart: Date;
}

export const useWeeklyRecs = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-weekly', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const defaultEndDate = endDate || new Date();
      const defaultStartDate = startDate || new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

      console.log('🔍 [useWeeklyRecs] Fetching weekly data via RPC');

      // Use optimized RPC function instead of fetching all leads
      const { data, error } = await supabase.rpc('get_weekly_recs_stats', {
        p_user_id: user.id,
        p_start_date: defaultStartDate.toISOString().split('T')[0],
        p_end_date: defaultEndDate.toISOString().split('T')[0]
      });

      if (error) {
        console.error('❌ [useWeeklyRecs] Error:', error);
        throw error;
      }

      console.log('✅ [useWeeklyRecs] Received', data?.length || 0, 'weeks of data');

      // Transform RPC data to match expected format
      const weeklyStats = (data || []).map(row => ({
        week: row.week_label,
        recs: Number(row.recs_count),
        weekStart: parseISO(row.week_start)
      }));

      return weeklyStats as WeeklyData[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos - cache mais longo
    gcTime: 1000 * 60 * 15, // 15 minutos - mantém dados em cache
  });
};
