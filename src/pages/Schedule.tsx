import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { CalendarToggle, CalendarViewType } from "@/components/calendar/CalendarToggle";
import { LiquidGlassCalendar } from "@/components/calendar/LiquidGlassCalendar";
import { EventsList, ScheduleEvent, GoogleTask } from "@/components/calendar/EventsList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { format, isSameDay, parseISO, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Phone, Loader2, CheckCircle2, ListTodo, Download, RefreshCw } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function Schedule() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [activeView, setActiveView] = useState<CalendarViewType>("calendar");
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<GoogleTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { data: agendamentos, isLoading, refetch } = useAgendamentos();
  const { 
    isConnected, 
    syncAgendamento, 
    isSyncing, 
    googleTasks, 
    isLoadingTasks, 
    refetchTasks 
  } = useGoogleCalendar();
  const queryClient = useQueryClient();

  // Refetch tasks when switching to tasks view
  useEffect(() => {
    if (activeView === "tasks" && isConnected) {
      refetchTasks();
    }
  }, [activeView, isConnected, refetchTasks]);

  // Transform agendamentos to events
  const allEvents: ScheduleEvent[] = useMemo(() => {
    if (!agendamentos) return [];

    return agendamentos.map((agendamento) => {
      const lead = agendamento.leads as any;
      if (!lead) return null;

      const date = parseISO(agendamento.data_agendamento);

      return {
        id: agendamento.id,
        lead_nome: lead.nome,
        lead_telefone: lead.telefone,
        horario: format(date, "HH:mm"),
        datetime: agendamento.data_agendamento,
        observacoes: agendamento.observacoes,
        synced_with_google: agendamento.synced_with_google || false,
        google_task_id: (agendamento as any).google_task_id || null,
        status: agendamento.status,
        lead_etapa: lead.etapa,
      };
    }).filter(Boolean) as ScheduleEvent[];
  }, [agendamentos]);

  // Filter events based on view and selected date
  const filteredEvents = useMemo(() => {
    let events = allEvents.filter((event) =>
      isSameDay(parseISO(event.datetime), selectedDate)
    );

    // In tasks view, only show events with google_task_id
    if (activeView === "tasks") {
      events = events.filter((event) => event.google_task_id);
    }

    return events;
  }, [allEvents, selectedDate, activeView]);

  // Get dates with events for calendar dots
  const datesWithEvents = useMemo(() => {
    const dates = new Set<string>();
    
    // Add dates from agendamentos
    allEvents.forEach((event) => {
      const dateStr = format(parseISO(event.datetime), "yyyy-MM-dd");
      dates.add(dateStr);
    });
    
    // Add dates from Google Tasks
    googleTasks.forEach((task: GoogleTask) => {
      if (task.due) {
        const dateStr = format(new Date(task.due), "yyyy-MM-dd");
        dates.add(dateStr);
      }
    });
    
    return Array.from(dates).map((dateStr) => parseISO(dateStr));
  }, [allEvents, googleTasks]);

  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleTaskClick = (task: GoogleTask) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const handleMarkAsCompleted = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("agendamentos_ligacoes")
      .update({ status: "realizado" })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success("Agendamento marcado como realizado");
    setDialogOpen(false);
    refetch();
  };

  const handleSync = async (id: string) => {
    await syncAgendamento(id);
    refetch();
  };

  const handleImportFromGoogle = async () => {
    if (!user) return;
    setIsImporting(true);

    try {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { data, error } = await supabase.functions.invoke("sync-google-calendar-events", {
        body: {
          user_id: user.id,
          start_date: today.toISOString(),
          end_date: nextMonth.toISOString(),
        },
      });

      if (error) throw error;

      toast.success(`✅ ${data.imported} eventos importados do Google Calendar!`, {
        description: data.skipped > 0 ? `${data.skipped} eventos já existentes foram ignorados` : undefined,
      });

      await refetch();
      await refetchTasks();
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-calls"] });
    } catch (error) {
      console.error("❌ Erro ao importar:", error);
      toast.error("Erro ao importar eventos do Google Calendar", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-3 sm:p-4 md:p-6 -m-4 md:-m-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <CalendarToggle activeView={activeView} onViewChange={setActiveView} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isConnected && activeView === "tasks" && (
              <Button
                onClick={() => refetchTasks()}
                disabled={isLoadingTasks}
                variant="ghost"
                size="sm"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-full px-3 sm:px-4 h-8 sm:h-9"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isLoadingTasks && "animate-spin")} />
                <span className="hidden sm:inline ml-2">Atualizar Tasks</span>
              </Button>
            )}
            {isConnected && (
              <Button
                onClick={handleImportFromGoogle}
                disabled={isImporting}
                variant="ghost"
                size="sm"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-full px-3 sm:px-4 h-8 sm:h-9"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline ml-2">Importando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-2">Importar</span>
                  </>
                )}
              </Button>
            )}
            <GoogleCalendarConnect />
          </div>
        </div>

        {/* Main Content - Responsive Split View */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,300px)_1fr] lg:grid-cols-[minmax(280px,350px)_1fr] gap-4 sm:gap-5 md:gap-6">
          {/* Left: Compact Calendar */}
          <div className="order-2 md:order-1">
            <LiquidGlassCalendar
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              datesWithEvents={datesWithEvents}
            />
          </div>

          {/* Right: Events List */}
          <div className="order-1 md:order-2">
            <EventsList
              selectedDate={selectedDate}
              events={filteredEvents}
              googleTasks={googleTasks as GoogleTask[]}
              onEventClick={handleEventClick}
              onTaskClick={handleTaskClick}
              isLoading={isLoading || (activeView === "tasks" && isLoadingTasks)}
              activeView={activeView}
            />
          </div>
        </div>

        {/* Event Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-white">Detalhes do Agendamento</DialogTitle>
              <DialogDescription className="text-white/50">
                Informações e ações para este agendamento
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{selectedEvent.lead_nome}</h3>
                    <Badge
                      variant={selectedEvent.status === "pendente" ? "default" : "secondary"}
                      className={cn(
                        selectedEvent.status === "pendente"
                          ? "bg-[#d4ff4a]/20 text-[#d4ff4a] border-[#d4ff4a]/30"
                          : "bg-white/10 text-white/70 border-white/20"
                      )}
                    >
                      {selectedEvent.status}
                    </Badge>
                    {selectedEvent.synced_with_google && (
                      <Badge variant="outline" className="gap-1 bg-white/10 text-emerald-400 border-emerald-500/30">
                        <Calendar className="h-3 w-3" />
                        Calendar
                      </Badge>
                    )}
                    {selectedEvent.google_task_id && (
                      <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/30">
                        <ListTodo className="h-3 w-3" />
                        Task
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-white/70 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(parseISO(selectedEvent.datetime), "dd 'de' MMMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                    {selectedEvent.lead_telefone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selectedEvent.lead_telefone}
                      </div>
                    )}
                  </div>

                  {selectedEvent.observacoes && (
                    <p className="text-sm text-white/50 pt-2">{selectedEvent.observacoes}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 flex-wrap">
                  {isConnected && !selectedEvent.synced_with_google && selectedEvent.status === "pendente" && (
                    <Button
                      variant="outline"
                      onClick={() => handleSync(selectedEvent.id)}
                      disabled={isSyncing}
                      className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 min-w-[140px]"
                    >
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Sincronizar
                        </>
                      )}
                    </Button>
                  )}

                  {selectedEvent.status === "pendente" && (
                    <Button
                      variant="default"
                      onClick={() => handleMarkAsCompleted(selectedEvent.id)}
                      className="flex-1 bg-[#d4ff4a] text-black hover:bg-[#c9f035] min-w-[140px]"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Task Details Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-amber-500/20 text-white max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-amber-400" />
                Google Task
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Tarefa importada do Google Tasks
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{selectedTask.title}</h3>
                    <Badge
                      variant={selectedTask.status === "needsAction" ? "default" : "secondary"}
                      className={cn(
                        selectedTask.status === "needsAction"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      )}
                    >
                      {selectedTask.status === "needsAction" ? "Pendente" : "Concluída"}
                    </Badge>
                  </div>

                  {selectedTask.due && (
                    <div className="flex items-center gap-1 text-sm text-white/70">
                      <Clock className="h-4 w-4" />
                      {format(new Date(selectedTask.due), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                  )}

                  {selectedTask.notes && (
                    <p className="text-sm text-white/50 pt-2">{selectedTask.notes}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
