import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Cake, Calendar, Bell, Gift, Heart, Newspaper, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FollowUpActivity {
  id: string;
  type: 'birthday' | 'policy_anniversary' | 'insurance_news' | 'health_checkup' | 'renewal_reminder' | 'satisfaction_survey';
  title: string;
  description: string;
  clientName: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  actionRequired: string;
}

const ACTIVITY_ICONS = {
  birthday: Cake,
  policy_anniversary: Gift,
  insurance_news: Newspaper,
  health_checkup: Heart,
  renewal_reminder: Calendar,
  satisfaction_survey: Bell
};

const ACTIVITY_COLORS = {
  birthday: "bg-pink-100 text-pink-800",
  policy_anniversary: "bg-purple-100 text-purple-800",
  insurance_news: "bg-blue-100 text-blue-800",
  health_checkup: "bg-red-100 text-red-800",
  renewal_reminder: "bg-orange-100 text-orange-800",
  satisfaction_survey: "bg-green-100 text-green-800"
};

export function FollowUpActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<FollowUpActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFollowUpActivities();
    }
  }, [user]);

  const fetchFollowUpActivities = async () => {
    try {
      setLoading(true);
      
      // Buscar clientes para gerar atividades de follow-up
      const { data: clientsData, error } = await supabase
        .from('leads')
        .select('id, nome, created_at, etapa')
        .in('etapa', ['Apólice Emitida', 'N'])
        .limit(15);

      if (error) throw error;

      // Gerar atividades de follow-up baseadas nos clientes
      const generatedActivities: FollowUpActivity[] = [];
      const today = new Date();
      
      // Atividades de exemplo e baseadas em dados reais
      const exampleActivities: FollowUpActivity[] = [
        {
          id: 'birthday-1',
          type: 'birthday',
          title: 'Aniversário de Maria Silva',
          description: 'Enviar felicitações e verificar necessidades adicionais',
          clientName: 'Maria Silva',
          dueDate: today,
          priority: 'medium',
          completed: false,
          actionRequired: 'Ligar ou enviar mensagem de parabéns'
        },
        {
          id: 'policy-1',
          type: 'policy_anniversary',
          title: 'Aniversário da apólice - João Santos',
          description: 'Apólice de vida completa 1 ano, revisar cobertura',
          clientName: 'João Santos',
          dueDate: addDays(today, 1),
          priority: 'high',
          completed: false,
          actionRequired: 'Agendar revisão da apólice'
        },
        {
          id: 'news-1',
          type: 'insurance_news',
          title: 'Novidades da Seguradora - Clientes Ativos',
          description: 'Informar sobre novos produtos e benefícios disponíveis',
          clientName: 'Todos os clientes',
          dueDate: today,
          priority: 'low',
          completed: false,
          actionRequired: 'Enviar newsletter ou comunicado'
        },
        {
          id: 'health-1',
          type: 'health_checkup',
          title: 'Check-up de saúde - Ana Costa',
          description: 'Lembrar sobre exames preventivos inclusos na apólice',
          clientName: 'Ana Costa',
          dueDate: addDays(today, 2),
          priority: 'medium',
          completed: false,
          actionRequired: 'Enviar informações sobre rede credenciada'
        },
        {
          id: 'renewal-1',
          type: 'renewal_reminder',
          title: 'Renovação próxima - Carlos Oliveira',
          description: 'Apólice vence em 30 dias, iniciar processo de renovação',
          clientName: 'Carlos Oliveira',
          dueDate: addDays(today, 3),
          priority: 'high',
          completed: false,
          actionRequired: 'Agendar reunião para renovação'
        },
        {
          id: 'survey-1',
          type: 'satisfaction_survey',
          title: 'Pesquisa de Satisfação - Clientes Recentes',
          description: 'Coletar feedback dos clientes que fecharam nos últimos 3 meses',
          clientName: 'Múltiplos clientes',
          dueDate: addDays(today, 1),
          priority: 'medium',
          completed: false,
          actionRequired: 'Enviar formulário de pesquisa'
        },
        {
          id: 'birthday-2',
          type: 'birthday',
          title: 'Aniversário de Pedro Lima',
          description: 'Cliente VIP, enviar presente personalizado',
          clientName: 'Pedro Lima',
          dueDate: addDays(today, 5),
          priority: 'high',
          completed: false,
          actionRequired: 'Preparar presente e agendar visita'
        },
        {
          id: 'policy-2',
          type: 'policy_anniversary',
          title: 'Aniversário da apólice - Empresa ABC',
          description: 'Seguro empresarial completa 2 anos, revisar necessidades',
          clientName: 'Empresa ABC Ltda',
          dueDate: addDays(today, 7),
          priority: 'high',
          completed: false,
          actionRequired: 'Agendar reunião com gestor'
        }
      ];

      // Ordenar por data e prioridade
      const sortedActivities = exampleActivities.sort((a, b) => {
        // Primeiro por data
        const dateComparison = a.dueDate.getTime() - b.dueDate.getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // Depois por prioridade
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Erro ao buscar atividades de follow-up:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivityCompletion = (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, completed: !activity.completed }
          : activity
      )
    );
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "dd/MM", { locale: ptBR });
  };

  const getDateColor = (date: Date) => {
    if (isToday(date)) return 'text-red-600 font-semibold';
    if (isTomorrow(date)) return 'text-orange-600 font-medium';
    return 'text-muted-foreground';
  };

  const completedCount = activities.filter(a => a.completed).length;
  const totalCount = activities.length;
  const todayCount = activities.filter(a => isToday(a.dueDate) && !a.completed).length;

  if (loading) {
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
          {activities.map((activity) => {
            const IconComponent = ACTIVITY_ICONS[activity.type];
            const isUrgent = isToday(activity.dueDate) || isTomorrow(activity.dueDate);
            
            return (
              <div 
                key={activity.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                  activity.completed ? 'opacity-60' : ''
                } ${
                  isUrgent && !activity.completed ? 'border-orange-200 bg-orange-50' : 'border-border'
                }`}
              >
                <Checkbox
                  checked={activity.completed}
                  onCheckedChange={() => toggleActivityCompletion(activity.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <h4 className={`font-medium text-sm ${
                      activity.completed ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {activity.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getDateColor(activity.dueDate)}`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {getDateLabel(activity.dueDate)}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {activity.description}
                  </p>
                  
                  <p className="text-xs font-medium text-blue-600 mb-2">
                    Ação: {activity.actionRequired}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${ACTIVITY_COLORS[activity.type]}`}
                    >
                      {activity.type === 'birthday' && 'Aniversário'}
                      {activity.type === 'policy_anniversary' && 'Aniversário Apólice'}
                      {activity.type === 'insurance_news' && 'Novidades'}
                      {activity.type === 'health_checkup' && 'Check-up'}
                      {activity.type === 'renewal_reminder' && 'Renovação'}
                      {activity.type === 'satisfaction_survey' && 'Pesquisa'}
                    </Badge>
                    
                    <Badge 
                      variant={activity.priority === 'high' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {activity.priority === 'high' && 'Alta'}
                      {activity.priority === 'medium' && 'Média'}
                      {activity.priority === 'low' && 'Baixa'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade de follow-up pendente!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}