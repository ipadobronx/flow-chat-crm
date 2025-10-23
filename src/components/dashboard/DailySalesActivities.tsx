import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar } from "lucide-react";
import { useDailyActivities } from "@/hooks/dashboard/useDailyActivities";

interface CompletedActivity {
  id: string;
  completed: boolean;
}

export function DailySalesActivities() {
  const { data: calls = [], isLoading } = useDailyActivities();
  const [completedCalls, setCompletedCalls] = useState<CompletedActivity[]>([]);

  const toggleCallCompletion = (callId: string) => {
    setCompletedCalls(prev => {
      const exists = prev.find(a => a.id === callId);
      if (exists) {
        return prev.map(a => a.id === callId ? { ...a, completed: !a.completed } : a);
      }
      return [...prev, { id: callId, completed: true }];
    });
  };

  const isCompleted = (callId: string) => {
    return completedCalls.find(a => a.id === callId)?.completed || false;
  };

  const completedCount = completedCalls.filter(a => a.completed).length;

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base sm:text-lg md:text-xl font-bold">
            Lembretes de Ligações e Agendamentos
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {completedCount}/{calls.length} concluídas
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm sm:text-base">📅 Nenhuma ligação agendada para hoje!</p>
            <p className="text-xs sm:text-sm mt-2">Seus lembretes aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const completed = isCompleted(call.id);
              
              return (
                <div
                  key={call.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={completed}
                    onCheckedChange={() => toggleCallCompletion(call.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Phone className="h-4 w-4 flex-shrink-0 text-blue-500" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1 min-w-0">
                          <h4 className={`text-sm font-bold truncate ${completed ? 'line-through text-muted-foreground' : ''}`}>
                            {call.lead_nome}
                          </h4>
                          {call.recomendante && call.recomendante.length > 0 && (
                            <button
                              onClick={() => window.location.href = `/dashboard/pipeline?lead=${call.lead_id}`}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors truncate text-left"
                              title="Ver detalhes do lead"
                            >
                              ({call.recomendante[0]})
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {call.synced_with_google && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Calendar className="h-3 w-3 text-emerald-500" />
                            Google
                          </Badge>
                        )}
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
                          {call.horario}
                        </span>
                      </div>
                    </div>
                    {call.observacoes && (
                      <p className={`text-xs text-muted-foreground mt-1 line-clamp-2 ${completed ? 'line-through' : ''}`}>
                        {call.observacoes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        📞 {call.lead_telefone}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
