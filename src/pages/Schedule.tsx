import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Schedule() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("pendente");
  const { data: agendamentos, isLoading, refetch } = useAgendamentos({ status: statusFilter });
  const { isConnected, syncAgendamento, isSyncing } = useGoogleCalendar();

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie suas ligações agendadas e sincronize com Google Calendar
          </p>
        </div>

        <GoogleCalendarConnect />

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtrar agendamentos por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "pendente" ? "default" : "outline"}
                onClick={() => setStatusFilter("pendente")}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === "realizado" ? "default" : "outline"}
                onClick={() => setStatusFilter("realizado")}
              >
                Realizados
              </Button>
              <Button
                variant={statusFilter === "cancelado" ? "default" : "outline"}
                onClick={() => setStatusFilter("cancelado")}
              >
                Cancelados
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : agendamentos && agendamentos.length > 0 ? (
          <div className="grid gap-4">
            {agendamentos.map((agendamento) => {
              const lead = agendamento.leads as any;
              if (!lead) return null;
              
              return (
              <Card key={agendamento.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{lead.nome}</h3>
                        <Badge variant={agendamento.status === 'pendente' ? 'default' : 'secondary'}>
                          {agendamento.status}
                        </Badge>
                        {agendamento.synced_with_google && (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            Sincronizado
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(agendamento.data_agendamento), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {lead.telefone}
                        </div>
                      </div>

                      {agendamento.observacoes && (
                        <p className="text-sm text-muted-foreground">
                          {agendamento.observacoes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {isConnected && !agendamento.synced_with_google && agendamento.status === 'pendente' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncAgendamento(agendamento.id)}
                          disabled={isSyncing}
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

                      {agendamento.status === 'pendente' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMarkAsCompleted(agendamento.id)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Marcar como Realizado
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum agendamento {statusFilter} encontrado
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}