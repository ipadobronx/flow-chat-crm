import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ScheduledCall {
  id: string;
  lead_id: string;
  lead_nome: string;
  lead_telefone: string;
  recomendante: string[] | null;
  data_agendamento: string;
  observacoes: string | null;
  synced_with_google: boolean;
  horario: string;
}

export const useDailyActivities = (selectedDate?: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['scheduled-calls', user?.id, selectedDate],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Generate date in local timezone to avoid UTC conversion issues
      const date = selectedDate 
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        : (() => {
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          })();

      console.log('🔍 [useDailyActivities] Fetching calls for date:', date, 'user:', user.id);

      const { data, error } = await supabase.rpc('get_scheduled_calls_for_today', {
        p_user_id: user.id,
        p_date: date
      });

      if (error) {
        console.error('❌ [useDailyActivities] Error fetching scheduled calls:', error);
        throw error;
      }
      
      console.log('✅ [useDailyActivities] Scheduled calls found:', data?.length || 0, 'calls');
      if (data && data.length > 0) {
        console.log('📋 [useDailyActivities] First call:', data[0]);
      }
      
      return (data || []) as ScheduledCall[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
    retry: 2,
    retryDelay: 1000,
  });
};
