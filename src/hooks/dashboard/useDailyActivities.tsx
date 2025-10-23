import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ScheduledCall {
  id: string;
  lead_id: string;
  lead_nome: string;
  lead_telefone: string;
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

      const date = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_scheduled_calls_for_today', {
        p_user_id: user.id,
        p_date: date
      });

      if (error) throw error;
      
      return (data || []) as ScheduledCall[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1,
  });
};
