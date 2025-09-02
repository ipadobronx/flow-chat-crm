import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTACache } from "./useTACache";
import { toast } from "sonner";

export type TAActionType = 'NAO_ATENDIDO' | 'LIGAR_DEPOIS' | 'MARCAR' | 'OI';

export const useTAActions = () => {
  const { user } = useAuth();
  const { invalidateTAData } = useTACache();

  const recordTAAction = async (leadId: string, etapa: TAActionType) => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('ta_actions')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          etapa
        });

      if (error) throw error;

      // Invalidar cache automaticamente após inserir nova ação
      await invalidateTAData();

      toast.success(`Ação TA registrada: ${getActionLabel(etapa)}`);
      return true;
    } catch (error) {
      console.error('Erro ao registrar ação TA:', error);
      toast.error("Erro ao registrar ação TA");
      return false;
    }
  };

  const getActionLabel = (etapa: TAActionType): string => {
    switch (etapa) {
      case 'NAO_ATENDIDO':
        return 'Não Atendeu';
      case 'LIGAR_DEPOIS':
        return 'Ligar Depois';
      case 'MARCAR':
        return 'Marcar no WhatsApp';
      case 'OI':
        return 'Agendado (OI)';
      default:
        return etapa;
    }
  };

  return {
    recordTAAction,
    getActionLabel
  };
};