import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MessageCircle, FileText, Clock, CheckCircle2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Activity {
  id: string;
  type: 'call' | 'whatsapp' | 'proposal_followup' | 'meeting' | 'other';
  title: string;
  description: string;
  leadName: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueTime?: string;
  leadId?: string;
}

const ACTIVITY_ICONS = {
  call: Phone,
  whatsapp: MessageCircle,
  proposal_followup: FileText,
  meeting: Clock,
  other: CheckCircle2
};

const ACTIVITY_COLORS = {
  call: "bg-blue-100 text-blue-800",
  whatsapp: "bg-green-100 text-green-800",
  proposal_followup: "bg-orange-100 text-orange-800",
  meeting: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800"
};

const PRIORITY_COLORS = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500"
};

export function DailySalesActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'call' as Activity['type'],
    title: '',
    description: '',
    leadName: '',
    priority: 'medium' as Activity['priority'],
    dueTime: ''
  });

  useEffect(() => {
    if (user) {
      fetchDailyActivities();
    }
  }, [user]);

  const fetchDailyActivities = async () => {
    try {
      setLoading(true);
      
      // Buscar leads que precisam de ação hoje
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('id, nome, etapa, created_at')
        .in('etapa', ['Novo', 'Ligar Depois', 'OI', 'PC'])
        .limit(20);

      if (error) throw error;

      // Gerar atividades baseadas no estado dos leads
      const generatedActivities: Activity[] = [];
      
      leadsData?.forEach((lead, index) => {
        switch (lead.etapa) {
          case 'Novo':
            generatedActivities.push({
              id: `call-${lead.id}`,
              type: 'call',
              title: `Ligar para ${lead.nome}`,
              description: 'Primeira ligação para apresentar os serviços',
              leadName: lead.nome,
              priority: 'high',
              completed: false,
              dueTime: '09:00',
              leadId: lead.id
            });
            break;
            
          case 'Ligar Depois':
            generatedActivities.push({
              id: `whatsapp-${lead.id}`,
              type: 'whatsapp',
              title: `Falar com ${lead.nome} no WhatsApp`,
              description: 'Enviar material informativo e agendar OI',
              leadName: lead.nome,
              priority: 'medium',
              completed: false,
              dueTime: '14:00',
              leadId: lead.id
            });
            break;
            
          case 'OI':
            generatedActivities.push({
              id: `meeting-${lead.id}`,
              type: 'meeting',
              title: `OI agendado com ${lead.nome}`,
              description: 'Realizar apresentação da proposta',
              leadName: lead.nome,
              priority: 'high',
              completed: false,
              dueTime: '10:30',
              leadId: lead.id
            });
            break;
            
          case 'PC':
            generatedActivities.push({
              id: `followup-${lead.id}`,
              type: 'proposal_followup',
              title: `Cobrar resposta da proposta - ${lead.nome}`,
              description: 'Verificar se há dúvidas e acelerar decisão',
              leadName: lead.nome,
              priority: 'high',
              completed: false,
              dueTime: '16:00',
              leadId: lead.id
            });
            break;
        }
      });

      // Adicionar algumas atividades de exemplo adicionais
      const exampleActivities: Activity[] = [
        {
          id: 'example-1',
          type: 'call',
          title: 'Ligar para Maria Silva',
          description: 'Retomar contato após 3 tentativas sem sucesso',
          leadName: 'Maria Silva',
          priority: 'medium',
          completed: false,
          dueTime: '11:00'
        },
        {
          id: 'example-2',
          type: 'whatsapp',
          title: 'WhatsApp para João Santos',
          description: 'Enviar comparativo de produtos solicitado',
          leadName: 'João Santos',
          priority: 'low',
          completed: true,
          dueTime: '08:30'
        },
        {
          id: 'example-3',
          type: 'proposal_followup',
          title: 'Follow-up proposta - Ana Costa',
          description: 'Proposta vence hoje, acelerar decisão',
          leadName: 'Ana Costa',
          priority: 'high',
          completed: false,
          dueTime: '15:00'
        }
      ];

      // Combinar atividades geradas e exemplos, limitando o total
      const allActivities = [...generatedActivities, ...exampleActivities]
        .slice(0, 8)
        .sort((a, b) => {
          // Ordenar por prioridade e depois por horário
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return (a.dueTime || '').localeCompare(b.dueTime || '');
        });

      setActivities(allActivities);
    } catch (error) {
      console.error('Erro ao buscar atividades diárias:', error);
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

  const addNewActivity = () => {
    if (!newActivity.title.trim() || !newActivity.leadName.trim()) {
      return;
    }

    const activity: Activity = {
      id: `custom-${Date.now()}`,
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description,
      leadName: newActivity.leadName,
      priority: newActivity.priority,
      completed: false,
      dueTime: newActivity.dueTime || undefined
    };

    setActivities(prev => [activity, ...prev]);
    
    // Reset form
    setNewActivity({
      type: 'call',
      title: '',
      description: '',
      leadName: '',
      priority: 'medium',
      dueTime: ''
    });
    
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setNewActivity({
      type: 'call',
      title: '',
      description: '',
      leadName: '',
      priority: 'medium',
      dueTime: ''
    });
  };

  const removeActivity = (activityId: string) => {
    // Só permite remover atividades criadas pelo usuário (que começam com 'custom-')
    if (activityId.startsWith('custom-')) {
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
    }
  };

  const canRemoveActivity = (activityId: string) => {
    return activityId.startsWith('custom-');
  };

  const completedCount = activities.filter(a => a.completed).length;
  const totalCount = activities.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividades Diárias do Funil</CardTitle>
          <CardDescription>Suas tarefas de vendas para hoje</CardDescription>
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
            <CardTitle>Atividades Diárias do Funil</CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })} • 
              {completedCount}/{totalCount} concluídas
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Atividade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Atividade</DialogTitle>
                <DialogDescription>
                  Crie uma nova atividade diária para o funil de vendas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leadName" className="text-right">
                    Cliente
                  </Label>
                  <Input
                    id="leadName"
                    value={newActivity.leadName}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, leadName: e.target.value }))}
                    className="col-span-3"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="title"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                    className="col-span-3"
                    placeholder="Ex: Ligar para cliente"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                    placeholder="Detalhes da atividade"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={newActivity.type}
                    onValueChange={(value: Activity['type']) => setNewActivity(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="proposal_followup">Follow-up</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Prioridade
                  </Label>
                  <Select
                    value={newActivity.priority}
                    onValueChange={(value: Activity['priority']) => setNewActivity(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueTime" className="text-right">
                    Horário
                  </Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={newActivity.dueTime}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={addNewActivity}
                  disabled={!newActivity.title.trim() || !newActivity.leadName.trim()}
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const IconComponent = ACTIVITY_ICONS[activity.type];
            
            return (
              <div 
                key={activity.id} 
                className={`relative flex items-start space-x-3 p-3 rounded-lg border-l-4 transition-all hover:bg-muted/50 ${
                  PRIORITY_COLORS[activity.priority]
                } ${
                  activity.completed ? 'opacity-60' : ''
                }`}
              >
                {canRemoveActivity(activity.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    onClick={() => removeActivity(activity.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                
                <Checkbox
                  checked={activity.completed}
                  onCheckedChange={() => toggleActivityCompletion(activity.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <h4 className={`font-medium text-sm ${
                      activity.completed ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {activity.title}
                    </h4>
                    {activity.dueTime && (
                      <Badge variant="outline" className="text-xs">
                        {activity.dueTime}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${ACTIVITY_COLORS[activity.type]}`}
                    >
                      {activity.type === 'call' && 'Ligação'}
                      {activity.type === 'whatsapp' && 'WhatsApp'}
                      {activity.type === 'proposal_followup' && 'Follow-up'}
                      {activity.type === 'meeting' && 'Reunião'}
                      {activity.type === 'other' && 'Outro'}
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
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Todas as atividades foram concluídas!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}