import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FollowUpActivity {
  id: string;
  lead_id: string;
  lead_nome: string;
  tipo_atividade: 'birthday' | 'agendamento' | 'reminder' | 'policy_anniversary';
  descricao: string;
  due_date: string;
  prioridade: 'urgent' | 'high' | 'medium' | 'low';
  acao_requerida: string;
}

export const useFollowUpActivities = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-followup', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const start = startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const end = endDate ? endDate : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endStr = end.toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_followup_activities_by_date', {
        p_user_id: user.id,
        p_start_date: start,
        p_end_date: endStr
      });

      if (error) throw error;
      
      return (data || []) as FollowUpActivity[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  });
};
