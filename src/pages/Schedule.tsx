import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { CalendarToggle, CalendarViewType } from "@/components/calendar/CalendarToggle";
import { LiquidGlassCalendar } from "@/components/calendar/LiquidGlassCalendar";
import { EventsList, ScheduleEvent } from "@/components/calendar/EventsList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { format, isSameDay, parseISO, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Phone, Loader2, CheckCircle2, ListTodo, Download } from "lucide-react";
import { useState, useMemo } from "react";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { data: agendamentos, isLoading, refetch } = useAgendamentos();
  const { isConnected, syncAgendamento, isSyncing } = useGoogleCalendar();
  const queryClient = useQueryClient();

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

    // Filter by view type
    if (activeView === "tasks") {
      events = events.filter((event) => event.google_task_id);
    }

    return events;
  }, [allEvents, selectedDate, activeView]);

  // Get dates with events for calendar dots
  const datesWithEvents = useMemo(() => {
    const dates = new Set<string>();
    allEvents.forEach((event) => {
      const dateStr = format(parseISO(event.datetime), "yyyy-MM-dd");
      dates.add(dateStr);
    });
    return Array.from(dates).map((dateStr) => parseISO(dateStr));
  }, [allEvents]);

  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 md:p-6 -m-4 md:-m-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <CalendarToggle activeView={activeView} onViewChange={setActiveView} />
          </div>

          <div className="flex items-center gap-3">
            {isConnected && (
              <Button
                onClick={handleImportFromGoogle}
                disabled={isImporting}
                variant="ghost"
                size="sm"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-full px-4"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Importar
                  </>
                )}
              </Button>
            )}
            <GoogleCalendarConnect />
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          {/* Left: Compact Calendar */}
          <div className="order-2 lg:order-1">
            <LiquidGlassCalendar
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              datesWithEvents={datesWithEvents}
            />
          </div>

          {/* Right: Events List */}
          <div className="order-1 lg:order-2">
            <EventsList
              selectedDate={selectedDate}
              events={filteredEvents}
              onEventClick={handleEventClick}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Event Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-w-md">
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

                  <div className="flex items-center gap-4 text-sm text-white/70">
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

                <div className="flex gap-2 pt-4">
                  {isConnected && !selectedEvent.synced_with_google && selectedEvent.status === "pendente" && (
                    <Button
                      variant="outline"
                      onClick={() => handleSync(selectedEvent.id)}
                      disabled={isSyncing}
                      className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Sincronizar com Google
                        </>
                      )}
                    </Button>
                  )}

                  {selectedEvent.status === "pendente" && (
                    <Button
                      variant="default"
                      onClick={() => handleMarkAsCompleted(selectedEvent.id)}
                      className="flex-1 bg-[#d4ff4a] text-black hover:bg-[#c9f035]"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como Realizado
                    </Button>
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
