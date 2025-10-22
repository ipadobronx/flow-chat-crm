import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Cake, Calendar, Bell, Gift, Newspaper, Clock } from "lucide-react";
import { useFollowUpActivities } from "@/hooks/dashboard/useFollowUpActivities";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTIVITY_ICONS = {
  birthday: Cake,
  policy_anniversary: Gift,
  insurance_news: Newspaper,
  agendamento: Calendar,
  reminder: Bell,
};

const ACTIVITY_COLORS = {
  birthday: "bg-pink-100 text-pink-800",
  policy_anniversary: "bg-purple-100 text-purple-800",
  insurance_news: "bg-blue-100 text-blue-800",
  agendamento: "bg-green-100 text-green-800",
  reminder: "bg-orange-100 text-orange-800",
};

export function FollowUpActivities() {
  const { data: activities = [], isLoading } = useFollowUpActivities();
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

  const toggleActivityCompletion = (activityId: string) => {
    setCompletedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "dd/MM", { locale: ptBR });
  };

  const getDateColor = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'text-red-600 font-semibold';
    if (isTomorrow(date)) return 'text-orange-600 font-medium';
    return 'text-muted-foreground';
  };

  const completedCount = Array.from(completedActivities).length;
  const totalCount = activities.length;
  const todayCount = activities.filter(a => isToday(parseISO(a.due_date)) && !completedActivities.has(a.id)).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividades de Follow-up</CardTitle>
          <CardDescription>Lembretes e ações de relacionamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando atividades...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Atividades de Follow-up</CardTitle>
            <CardDescription>
              {completedCount}/{totalCount} concluídas • {todayCount} para hoje
            </CardDescription>
          </div>
          {todayCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {todayCount} urgente{todayCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma atividade de follow-up pendente!</p>
            </div>
          ) : (
            activities.map((activity) => {
              const IconComponent = ACTIVITY_ICONS[activity.tipo_atividade as keyof typeof ACTIVITY_ICONS] || Bell;
              const isCompleted = completedActivities.has(activity.id);
              const isUrgent = isToday(parseISO(activity.due_date)) || isTomorrow(parseISO(activity.due_date));
              
              return (
                <div 
                  key={activity.id} 
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                    isCompleted ? 'opacity-60' : ''
                  } ${
                    isUrgent && !isCompleted ? 'border-orange-200 bg-orange-50' : 'border-border'
                  }`}
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleActivityCompletion(activity.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <h4 className={`font-medium text-sm ${
                        isCompleted ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {activity.descricao}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getDateColor(activity.due_date)}`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {getDateLabel(activity.due_date)}
                      </Badge>
                    </div>
                    
                    <p className="text-xs font-medium text-blue-600 mb-2">
                      Ação: {activity.acao_requerida}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${ACTIVITY_COLORS[activity.tipo_atividade as keyof typeof ACTIVITY_COLORS] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {activity.tipo_atividade === 'birthday' && 'Aniversário'}
                        {activity.tipo_atividade === 'policy_anniversary' && 'Aniversário Apólice'}
                        {activity.tipo_atividade === 'agendamento' && 'Agendamento'}
                        {activity.tipo_atividade === 'reminder' && 'Lembrete'}
                      </Badge>
                      
                      <Badge 
                        variant={activity.prioridade === 'urgent' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {activity.prioridade === 'urgent' && 'Urgente'}
                        {activity.prioridade === 'high' && 'Alta'}
                        {activity.prioridade === 'medium' && 'Média'}
                        {activity.prioridade === 'low' && 'Baixa'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
