import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, MessageSquare, UserCheck } from "lucide-react";
import { useDailyActivities } from "@/hooks/dashboard/useDailyActivities";

interface CompletedActivity {
  id: string;
  completed: boolean;
}

const ACTIVITY_ICONS: Record<string, any> = {
  Ligar: Phone,
  "Agendar OI": Calendar,
  "Agendar PC": MessageSquare,
  "Fechar Negócio": UserCheck,
  "Follow-up": MessageSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  Ligar: "text-blue-500",
  "Agendar OI": "text-purple-500",
  "Agendar PC": "text-orange-500",
  "Fechar Negócio": "text-green-500",
  "Follow-up": "text-cyan-500",
};

const PRIORITY_COLORS: Record<string, "destructive" | "default" | "secondary"> = {
  urgent: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
};

export function DailySalesActivities() {
  const { data: activities = [], isLoading } = useDailyActivities();
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([]);

  const toggleActivityCompletion = (activityId: string) => {
    setCompletedActivities(prev => {
      const exists = prev.find(a => a.id === activityId);
      if (exists) {
        return prev.map(a => a.id === activityId ? { ...a, completed: !a.completed } : a);
      }
      return [...prev, { id: activityId, completed: true }];
    });
  };

  const isCompleted = (activityId: string) => {
    return completedActivities.find(a => a.id === activityId)?.completed || false;
  };

  const completedCount = completedActivities.filter(a => a.completed).length;

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base sm:text-lg md:text-xl font-bold">
            Atividades de Vendas de Hoje
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {completedCount}/{activities.length} concluídas
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm sm:text-base">🎉 Nenhuma atividade pendente!</p>
            <p className="text-xs sm:text-sm mt-2">Você está em dia com suas tarefas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.tipo_atividade] || Phone;
              const completed = isCompleted(activity.id);
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={completed}
                    onCheckedChange={() => toggleActivityCompletion(activity.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon className={`h-4 w-4 flex-shrink-0 ${ACTIVITY_COLORS[activity.tipo_atividade] || 'text-gray-500'}`} />
                        <h4 className={`text-sm font-medium truncate ${completed ? 'line-through text-muted-foreground' : ''}`}>
                          {activity.tipo_atividade} - {activity.lead_nome}
                        </h4>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {activity.tempo_estimado}
                      </span>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 line-clamp-2 ${completed ? 'line-through' : ''}`}>
                      {activity.descricao}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {activity.etapa}
                      </Badge>
                      <Badge variant={PRIORITY_COLORS[activity.prioridade]} className="text-xs">
                        {activity.prioridade === 'urgent' && 'Urgente'}
                        {activity.prioridade === 'high' && 'Alta'}
                        {activity.prioridade === 'medium' && 'Média'}
                        {activity.prioridade === 'low' && 'Baixa'}
                      </Badge>
                      {activity.lead_telefone && (
                        <Badge variant="secondary" className="text-xs">
                          📞 {activity.lead_telefone}
                        </Badge>
                      )}
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
