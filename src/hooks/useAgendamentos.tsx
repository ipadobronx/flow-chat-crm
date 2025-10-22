import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AgendamentoFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export const useAgendamentos = (filters?: AgendamentoFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agendamentos', user?.id, filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('agendamentos_ligacoes')
        .select('*, leads(*)')
        .eq('user_id', user.id)
        .order('data_agendamento', { ascending: true });

      if (filters?.startDate) {
        query = query.gte('data_agendamento', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('data_agendamento', filters.endDate.toISOString());
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching agendamentos:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
};
