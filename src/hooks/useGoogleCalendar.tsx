import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useGoogleCalendar = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Verificar se está conectado
  const { data: isConnected, isLoading } = useQuery({
    queryKey: ['google-calendar-connected', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('id, sync_enabled, last_sync_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking Google Calendar connection:', error);
        return false;
      }

      return !!data && data.sync_enabled;
    },
    enabled: !!user,
  });

  // Iniciar OAuth
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke(
        `google-calendar-oauth?action=auth&userId=${user.id}`,
        { method: 'GET' }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Abrir URL de autenticação em popup
      const popup = window.open(data.authUrl, 'Google Calendar Auth', 'width=600,height=700');
      
      // Polling para verificar quando a conexão foi estabelecida
      const checkInterval = setInterval(async () => {
        const { data: tokenData } = await supabase
          .from('google_calendar_tokens')
          .select('id')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (tokenData) {
          clearInterval(checkInterval);
          if (popup && !popup.closed) popup.close();
          queryClient.invalidateQueries({ queryKey: ['google-calendar-connected'] });
          toast.success('Google Calendar conectado com sucesso!');
        }
      }, 1000);

      // Limpar interval após 2 minutos
      setTimeout(() => {
        clearInterval(checkInterval);
        if (popup && !popup.closed) popup.close();
      }, 120000);
    },
    onError: (error) => {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Erro ao conectar Google Calendar. Verifique se as credenciais estão configuradas corretamente no Supabase.');
    },
  });

  // Desconectar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user || !session) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('google-calendar-oauth', {
        method: 'POST',
        body: { action: 'disconnect' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connected'] });
      toast.success('Google Calendar desconectado');
    },
    onError: (error) => {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Erro ao desconectar Google Calendar');
    },
  });

  // Sincronizar agendamento específico
  const syncAgendamentoMutation = useMutation({
    mutationFn: async (agendamentoId: string) => {
      if (!user || !session) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { agendamentoId },
      });

      if (error) throw error;
      
      // Verificar se houve erro na resposta da edge function
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Sincronizado com Google Calendar!');
    },
    onError: (error: any) => {
      console.error('Error syncing with Google Calendar:', error);
      if (error.message?.includes('not connected')) {
        toast.error('Conecte sua conta Google primeiro');
      } else {
        toast.error('Erro ao sincronizar com Google Calendar');
      }
    },
  });

  return {
    isConnected: !!isConnected,
    isLoading,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    syncAgendamento: syncAgendamentoMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isSyncing: syncAgendamentoMutation.isPending,
  };
};
