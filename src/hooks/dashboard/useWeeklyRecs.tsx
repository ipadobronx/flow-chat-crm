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
      
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', defaultStartDate.toISOString())
        .lte('created_at', defaultEndDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const weeks = eachWeekOfInterval(
        {
          start: defaultStartDate,
          end: defaultEndDate
        },
        { weekStartsOn: 1 }
      );

      const weeklyStats = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        const recsInWeek = leadsData?.filter(lead => {
          const leadDate = parseISO(lead.created_at);
          return leadDate >= weekStart && leadDate <= weekEnd;
        }).length || 0;

        return {
          week: format(weekStart, "dd/MM", { locale: ptBR }),
          recs: recsInWeek,
          weekStart
        };
      });

      return weeklyStats as WeeklyData[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};
