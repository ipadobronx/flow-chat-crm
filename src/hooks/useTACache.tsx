import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useTACache = () => {
  const queryClient = useQueryClient();

  const invalidateTAData = async () => {
    try {
      // Invalidar todas as queries relacionadas ao TA
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ta-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['ta-temporal'] }),
        queryClient.invalidateQueries({ queryKey: ['ta-efficiency'] }),
        queryClient.invalidateQueries({ queryKey: ['ta-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['ta-actions'] }),
      ]);

      // Remover dados do cache para forçar re-fetch
      queryClient.removeQueries({ queryKey: ['ta-dashboard'] });
      queryClient.removeQueries({ queryKey: ['ta-temporal'] });
      queryClient.removeQueries({ queryKey: ['ta-efficiency'] });
      queryClient.removeQueries({ queryKey: ['ta-reports'] });
      queryClient.removeQueries({ queryKey: ['ta-actions'] });

      toast.success("Dados TA atualizados com sucesso!");
    } catch (error) {
      console.error('Erro ao invalidar cache TA:', error);
      toast.error("Erro ao atualizar dados TA");
    }
  };

  const clearTACache = () => {
    // Limpar completamente o cache TA
    queryClient.clear();
    toast.success("Cache TA limpo com sucesso!");
  };

  return {
    invalidateTAData,
    clearTACache
  };
};