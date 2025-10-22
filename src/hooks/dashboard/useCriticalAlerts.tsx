import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CriticalAlert {
  id: string;
  lead_id: string;
  lead_nome: string;
  tipo_alerta: 'stalled_deal' | 'missed_call' | 'callback_pending' | 'contract_expiry';
  titulo: string;
  descricao: string;
  severidade: 'critical' | 'high' | 'medium' | 'low';
  acao_requerida: string;
  due_date: string;
}

export const useCriticalAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const date = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_critical_alerts_by_date', {
        p_user_id: user.id,
        p_date: date
      });

      if (error) throw error;
      
      return (data || []) as CriticalAlert[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // 1 minuto
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};
