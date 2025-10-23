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
      // SEMPRE criar agendamento no Supabase primeiro
      const { data, error } = await supabase
        .from('agendamentos_ligacoes')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          data_agendamento: dataAgendamento.toISOString(),
          observacoes: observacoes || `${tipo === 'sitplan' ? 'SitPlan' : tipo === 'callback' ? 'Ligar Depois' : 'Ligação'}: ${leadNome}`,
          status: 'pendente',
          synced_with_google: false
        })
        .select()
        .single();

      if (error) throw error;

      // Depois sincronizar com Google Calendar (se conectado)
      if (isConnected && data) {
        try {
          await syncAgendamento(data.id);
          
          // Atualizar flag de sincronização após sucesso
          await supabase
            .from('agendamentos_ligacoes')
            .update({ synced_with_google: true })
            .eq('id', data.id);
          
          console.log('✅ Agendamento salvo no Supabase e sincronizado com Google Calendar');
          return true; // Indica que sincronizou
        } catch (syncError) {
          console.error('⚠️ Erro ao sincronizar com Google Calendar (mas salvou no Supabase):', syncError);
          // Não falhar a operação - agendamento já foi salvo no Supabase
          return false;
        }
      }

      console.log('✅ Agendamento salvo no Supabase (Google Calendar não conectado)');
      return false; // Indica que não sincronizou (mas salvou localmente)
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      throw error; // Propagar erro para o componente mostrar toast
    }
  };

  return {
    syncCalendarEvent,
    isConnected
  };
};
