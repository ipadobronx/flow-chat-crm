import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { format, isSameDay, parseISO, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Schedule() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("pendente");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const { data: agendamentos, isLoading, refetch } = useAgendamentos({ status: statusFilter });
  const { isConnected, syncAgendamento, isSyncing } = useGoogleCalendar();

  // Dias com agendamentos (para destacar no calendário)
  const datesWithEvents = useMemo(() => {
    if (!agendamentos) return [];
    return agendamentos.map(a => parseISO(a.data_agendamento));
  }, [agendamentos]);

  // Agendamentos do dia selecionado
  const selectedDayEvents = useMemo(() => {
    if (!agendamentos) return [];
    return agendamentos
      .filter(a => isSameDay(parseISO(a.data_agendamento), selectedDate))
      .sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime());
  }, [agendamentos, selectedDate]);

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
    refetch();
  };

  const handleSync = async (id: string) => {
    await syncAgendamento(id);
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
            <p className="text-muted-foreground">
              Gerencie suas ligações agendadas e sincronize com Google Calendar
            </p>
          </div>
          <GoogleCalendarConnect />
        </div>

        {/* Filtros */}
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

        {/* Layout: Calendário + Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Calendário Lateral */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Calendário</CardTitle>
              <CardDescription className="text-xs">
                Selecione uma data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border pointer-events-auto"
                locale={ptBR}
                modifiers={{
                  hasEvents: datesWithEvents,
                }}
                modifiersStyles={{
                  hasEvents: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Lista de Eventos do Dia */}
          <Card>
            <CardHeader>
              <CardTitle>
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                {selectedDayEvents.length === 0 
                  ? "Nenhum agendamento neste dia"
                  : `${selectedDayEvents.length} agendamento${selectedDayEvents.length > 1 ? 's' : ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum agendamento {statusFilter} para este dia
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((agendamento) => {
                    const lead = agendamento.leads as any;
                    if (!lead) return null;

                    return (
                      <Card key={agendamento.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4 pb-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-semibold">{lead.nome}</h3>
                                  <Badge variant={agendamento.status === 'pendente' ? 'default' : 'secondary'}>
                                    {agendamento.status}
                                  </Badge>
                                  {agendamento.synced_with_google && (
                                    <Badge variant="outline" className="gap-1">
                                      <CalendarIcon className="h-3 w-3 text-green-500" />
                                      Sincronizado
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {format(new Date(agendamento.data_agendamento), "HH:mm")}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    {lead.telefone}
                                  </div>
                                </div>

                                {agendamento.observacoes && (
                                  <p className="text-sm text-muted-foreground pt-2">
                                    {agendamento.observacoes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              {isConnected && !agendamento.synced_with_google && agendamento.status === 'pendente' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSync(agendamento.id)}
                                  disabled={isSyncing}
                                >
                                  {isSyncing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      Sincronizar
                                    </>
                                  )}
                                </Button>
                              )}

                              {agendamento.status === 'pendente' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleMarkAsCompleted(agendamento.id)}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Concluir
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}