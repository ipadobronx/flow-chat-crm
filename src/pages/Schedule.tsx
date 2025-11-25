import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { FullScreenCalendar, CalendarData, CalendarEvent } from "@/components/calendar/FullScreenCalendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Phone, Loader2, CheckCircle2, X, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export default function Schedule() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("pendente");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { data: agendamentos, isLoading, refetch } = useAgendamentos({ status: statusFilter });
  const { isConnected, syncAgendamento, isSyncing } = useGoogleCalendar();
  const queryClient = useQueryClient();

  // Transformar agendamentos em dados do calendário
  const calendarData: CalendarData[] = useMemo(() => {
    if (!agendamentos) return [];

    const dataMap = new Map<string, CalendarEvent[]>();

    agendamentos.forEach((agendamento) => {
      const lead = agendamento.leads as any;
      if (!lead) return;

      const date = parseISO(agendamento.data_agendamento);
      const dateKey = format(date, "yyyy-MM-dd");

      const event: CalendarEvent = {
        id: agendamento.id,
        lead_nome: lead.nome,
        lead_telefone: lead.telefone,
        horario: format(date, "HH:mm"),
        datetime: agendamento.data_agendamento,
        observacoes: agendamento.observacoes,
        synced_with_google: agendamento.synced_with_google || false,
        status: agendamento.status,
        lead_etapa: lead.etapa,
      };

      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, []);
      }
      dataMap.get(dateKey)!.push(event);
    });

    return Array.from(dataMap.entries()).map(([dateStr, events]) => ({
      day: parseISO(dateStr),
      events: events.sort((a, b) => a.horario.localeCompare(b.horario)),
    }));
  }, [agendamentos]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleMarkAsCompleted = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('agendamentos_ligacoes')
      .update({ status: 'realizado' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success('Agendamento marcado como realizado');
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

      console.log('🔄 Importando eventos do Google Calendar...');

      const { data, error } = await supabase.functions.invoke('sync-google-calendar-events', {
        body: {
          user_id: user.id,
          start_date: today.toISOString(),
          end_date: nextMonth.toISOString()
        }
      });

      if (error) throw error;

      console.log('✅ Importação concluída:', data);

      toast.success(`✅ ${data.imported} eventos importados do Google Calendar!`, {
        description: data.skipped > 0 ? `${data.skipped} eventos já existentes foram ignorados` : undefined
      });

      await refetch();
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-calls'] });
    } catch (error) {
      console.error('❌ Erro ao importar:', error);
      toast.error('Erro ao importar eventos do Google Calendar', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-end gap-3">
          <GoogleCalendarConnect />
          {isConnected && (
            <Button
              onClick={handleImportFromGoogle}
              disabled={isImporting}
              variant="outline"
              size="sm"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Importar do Google Calendar
                </>
              )}
            </Button>
          )}
        </div>

        {isConnected && agendamentos && agendamentos.length === 0 && !isLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você tem o Google Calendar conectado mas nenhum agendamento local.{' '}
              <Button 
                variant="link" 
                onClick={handleImportFromGoogle} 
                className="px-1 h-auto font-semibold"
                disabled={isImporting}
              >
                {isImporting ? 'Importando...' : 'Clique aqui para importar seus eventos.'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Calendário de Agendamentos</CardTitle>
              <CardDescription>Visualize e gerencie seus agendamentos</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "pendente" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pendente")}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === "realizado" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("realizado")}
              >
                Realizados
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <FullScreenCalendar 
                data={calendarData} 
                onEventClick={handleEventClick}
              />
            )}
          </CardContent>
        </Card>

        {/* Dialog de detalhes do evento */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
              <DialogDescription>
                Informações e ações para este agendamento
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{selectedEvent.lead_nome}</h3>
                    <Badge variant={selectedEvent.status === 'pendente' ? 'default' : 'secondary'}>
                      {selectedEvent.status}
                    </Badge>
                    {selectedEvent.synced_with_google && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        Sincronizado
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(parseISO(selectedEvent.datetime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {selectedEvent.lead_telefone}
                    </div>
                  </div>

                  {selectedEvent.observacoes && (
                    <p className="text-sm text-muted-foreground pt-2">
                      {selectedEvent.observacoes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  {isConnected && !selectedEvent.synced_with_google && selectedEvent.status === 'pendente' && (
                    <Button
                      variant="outline"
                      onClick={() => handleSync(selectedEvent.id)}
                      disabled={isSyncing}
                      className="flex-1"
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

                  {selectedEvent.status === 'pendente' && (
                    <Button
                      variant="default"
                      onClick={() => handleMarkAsCompleted(selectedEvent.id)}
                      className="flex-1"
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