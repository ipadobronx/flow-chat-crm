import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface CreateTaskParams {
  title: string;
  notes?: string;
  dueDate?: string;
}

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: "needsAction" | "completed";
}

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

  // Buscar Google Tasks
  const { 
    data: googleTasks, 
    isLoading: isLoadingTasks,
    refetch: refetchTasks 
  } = useQuery({
    queryKey: ['google-tasks', user?.id],
    queryFn: async () => {
      if (!user || !session) return [];
      
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { action: 'list-tasks' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching Google Tasks:', error);
        return [];
      }

      if (data?.error) {
        console.error('Google Tasks API error:', data.error);
        return [];
      }

      return (data?.tasks || []).map((task: GoogleTask) => ({
        ...task,
        isGoogleTask: true,
      }));
    },
    enabled: !!user && !!session && !!isConnected,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
          queryClient.invalidateQueries({ queryKey: ['google-tasks'] });
          toast.success('Google Calendar e Tasks conectados com sucesso!');
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
      queryClient.invalidateQueries({ queryKey: ['google-tasks'] });
      toast.success('Google Calendar desconectado');
    },
    onError: (error) => {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Erro ao desconectar Google Calendar');
    },
  });

  // Sincronizar agendamento específico (com opção de criar tarefa)
  const syncAgendamentoMutation = useMutation({
    mutationFn: async ({ agendamentoId, createTask = false }: { agendamentoId: string; createTask?: boolean }) => {
      if (!user || !session) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { agendamentoId, createTask },
      });

      if (error) throw error;
      
      // Verificar se houve erro na resposta da edge function
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['google-tasks'] });
      const message = data?.taskId 
        ? 'Sincronizado com Google Calendar e Tasks!' 
        : 'Sincronizado com Google Calendar!';
      toast.success(message);
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

  // Criar tarefa no Google Tasks
  const createTaskMutation = useMutation({
    mutationFn: async ({ title, notes, dueDate }: CreateTaskParams) => {
      if (!user || !session) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { 
          action: 'create-task',
          title, 
          notes, 
          dueDate 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-tasks'] });
      toast.success('Tarefa criada no Google Tasks!');
    },
    onError: (error: any) => {
      console.error('Error creating Google Task:', error);
      if (error.message?.includes('not connected')) {
        toast.error('Conecte sua conta Google primeiro');
      } else {
        toast.error('Erro ao criar tarefa no Google Tasks');
      }
    },
  });

  return {
    isConnected: !!isConnected,
    isLoading,
    googleTasks: googleTasks || [],
    isLoadingTasks,
    refetchTasks,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    syncAgendamento: (agendamentoId: string, createTask: boolean = false) => 
      syncAgendamentoMutation.mutate({ agendamentoId, createTask }),
    syncAgendamentoAsync: (agendamentoId: string, createTask: boolean = false) => 
      syncAgendamentoMutation.mutateAsync({ agendamentoId, createTask }),
    createTask: createTaskMutation.mutate,
    createTaskAsync: createTaskMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isSyncing: syncAgendamentoMutation.isPending,
    isCreatingTask: createTaskMutation.isPending,
  };
};
