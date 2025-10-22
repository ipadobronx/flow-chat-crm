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

      // Abrir URL de autenticação em nova janela
      const authUrl = data.authUrl;
      window.open(authUrl, '_blank', 'width=600,height=700');

      return data;
    },
    onSuccess: (data) => {
      // Redirecionar para a URL de autenticação na mesma aba
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Erro ao conectar com Google Calendar');
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
        method: 'POST',
        body: { action: 'sync', agendamentoId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
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
