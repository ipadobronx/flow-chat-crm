import { useAuth } from "./useAuth";
import { useGoogleCalendar } from "./useGoogleCalendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncCalendarEventParams {
  leadId: string;
  leadNome: string;
  dataAgendamento: Date;
  observacoes?: string | null;
  tipo?: 'ligacao' | 'sitplan' | 'callback';
}

export const useCalendarSync = () => {
  const { user } = useAuth();
  const { isConnected, syncAgendamento } = useGoogleCalendar();

  const syncCalendarEvent = async ({
    leadId,
    leadNome,
    dataAgendamento,
    observacoes,
    tipo = 'callback'
  }: SyncCalendarEventParams): Promise<boolean> => {
    if (!user) return false;

    try {
      // Criar agendamento na tabela
      const { data, error } = await supabase
        .from('agendamentos_ligacoes')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          data_agendamento: dataAgendamento.toISOString(),
          observacoes: observacoes || `${tipo === 'sitplan' ? 'SitPlan' : tipo === 'callback' ? 'Ligar Depois' : 'Ligação'}: ${leadNome}`,
          status: 'pendente'
        })
        .select()
        .single();

      if (error) throw error;

      // Sincronizar com Google Calendar se conectado
      if (isConnected && data) {
        syncAgendamento(data.id);
        return true; // Indica que sincronizou
      }

      return false; // Indica que não sincronizou (mas salvou localmente)
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return false;
    }
  };

  return {
    syncCalendarEvent,
    isConnected
  };
};
