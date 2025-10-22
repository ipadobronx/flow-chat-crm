import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDashboardCache = () => {
  const queryClient = useQueryClient();

  const invalidateAllDashboard = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-kpi'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-funnel'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-weekly'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-pipeline'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-activities'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-followup'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] })
      ]);

      toast.success("Dashboard atualizado com sucesso!");
    } catch (error) {
      console.error('Erro ao invalidar cache do dashboard:', error);
      toast.error("Erro ao atualizar dashboard");
    }
  };

  const clearDashboardCache = () => {
    queryClient.removeQueries({ queryKey: ['dashboard-kpi'] });
    queryClient.removeQueries({ queryKey: ['dashboard-funnel'] });
    queryClient.removeQueries({ queryKey: ['dashboard-weekly'] });
    queryClient.removeQueries({ queryKey: ['dashboard-pipeline'] });
    queryClient.removeQueries({ queryKey: ['dashboard-activities'] });
    queryClient.removeQueries({ queryKey: ['dashboard-followup'] });
    queryClient.removeQueries({ queryKey: ['dashboard-alerts'] });
    toast.success("Cache do dashboard limpo!");
  };

  return {
    invalidateAllDashboard,
    clearDashboardCache
  };
};
