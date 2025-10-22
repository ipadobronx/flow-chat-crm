import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DailyActivity {
  id: string;
  lead_id: string;
  lead_nome: string;
  lead_telefone: string;
  etapa: string;
  tipo_atividade: string;
  prioridade: 'urgent' | 'high' | 'medium' | 'low';
  descricao: string;
  tempo_estimado: string;
}

export const useDailyActivities = (selectedDate?: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-activities', user?.id, selectedDate],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const date = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_daily_activities_by_date', {
        p_user_id: user.id,
        p_date: date
      });

      if (error) throw error;
      
      return (data || []) as DailyActivity[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // 1 minuto
  });
};
