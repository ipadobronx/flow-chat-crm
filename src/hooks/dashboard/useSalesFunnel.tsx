import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FunnelMetrics {
  total_rec: number;
  total_ligacoes: number;
  total_oi_agendados: number;
  total_proposta_apresentada: number;
  total_n_realizado: number;
  total_apolice_emitida: number;
  taxa_conversao_ligacao: number;
  taxa_conversao_oi: number;
  taxa_conversao_proposta: number;
  taxa_conversao_n: number;
  taxa_conversao_apolice: number;
}

export const useSalesFunnel = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-funnel', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const start = startDate ? startDate.toISOString().split('T')[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate ? endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_kpi_metrics_by_date_range', {
        p_user_id: user.id,
        p_start_date: start,
        p_end_date: end
      });

      if (error) throw error;
      
      return data?.[0] as FunnelMetrics;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};
