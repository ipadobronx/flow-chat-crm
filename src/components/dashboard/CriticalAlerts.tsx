import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CreditCard, 
  UserX, 
  FileX, 
  Heart, 
  Clock, 
  Phone, 
  ExternalLink,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CriticalAlert {
  id: string;
  type: 'payment_failure' | 'health_rejection' | 'uw_pending' | 'serious_illness_rejection' | 'policy_cancellation' | 'document_missing';
  title: string;
  description: string;
  clientName: string;
  policyNumber?: string;
  severity: 'critical' | 'high' | 'medium';
  actionRequired: string;
  dueDate?: Date;
  dismissed: boolean;
}

const ALERT_ICONS = {
  payment_failure: CreditCard,
  health_rejection: UserX,
  uw_pending: Clock,
  serious_illness_rejection: Heart,
  policy_cancellation: FileX,
  document_missing: AlertTriangle
};

const ALERT_COLORS = {
  critical: "border-red-500 bg-red-50",
  high: "border-orange-500 bg-orange-50",
  medium: "border-yellow-500 bg-yellow-50"
};

const SEVERITY_COLORS = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800"
};

export function CriticalAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCriticalAlerts();
    }
  }, [user]);

  const fetchCriticalAlerts = async () => {
    try {
      setLoading(true);
      
      // Buscar dados que podem gerar alertas críticos
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('id, nome, etapa, created_at')
        .in('etapa', ['Apólice Emitida', 'PC', 'OI'])
        .limit(10);

      if (error) throw error;

      // Gerar alertas críticos de exemplo baseados em situações reais
      const criticalAlerts: CriticalAlert[] = [
        {
          id: 'payment-1',
          type: 'payment_failure',
          title: 'Falha de pagamento detectada',
          description: 'Cobrança da apólice 12345 foi rejeitada pelo banco',
          clientName: 'Maria Silva',
          policyNumber: '12345',
          severity: 'critical',
          actionRequired: 'Entrar em contato imediatamente para atualizar dados bancários',
          dueDate: new Date(),
          dismissed: false
        },
        {
          id: 'health-1',
          type: 'health_rejection',
          title: 'Reprovação na avaliação de saúde',
          description: 'Cliente não passou na análise médica para seguro de vida',
          clientName: 'João Santos',
          policyNumber: '67890',
          severity: 'high',
          actionRequired: 'Oferecer produtos alternativos ou condições especiais',
          dismissed: false
        },
        {
          id: 'uw-1',
          type: 'uw_pending',
          title: 'Pendência na subscrição há 5 dias',
          description: 'Documentação aguardando análise da UW há mais tempo que o esperado',
          clientName: 'Ana Costa',
          policyNumber: '54321',
          severity: 'medium',
          actionRequired: 'Verificar status com equipe de subscrição',
          dismissed: false
        },
        {
          id: 'illness-1',
          type: 'serious_illness_rejection',
          title: 'Reprovação por doença grave',
          description: 'Solicitação negada devido a histórico médico do segurado',
          clientName: 'Carlos Oliveira',
          severity: 'critical',
          actionRequired: 'Agendar reunião para explicar alternativas disponíveis',
          dismissed: false
        },
        {
          id: 'cancellation-1',
          type: 'policy_cancellation',
          title: 'Cliente solicitou cancelamento',
          description: 'Apólice em risco de cancelamento por insatisfação',
          clientName: 'Pedro Lima',
          policyNumber: '98765',
          severity: 'high',
          actionRequired: 'Contato urgente para retenção do cliente',
          dismissed: false
        },
        {
          id: 'document-1',
          type: 'document_missing',
          title: 'Documentos obrigatórios em falta',
          description: 'Faltam documentos para finalizar a emissão da apólice',
          clientName: 'Empresa ABC Ltda',
          policyNumber: '11111',
          severity: 'medium',
          actionRequired: 'Solicitar envio dos documentos pendentes',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          dismissed: false
        }
      ];

      // Filtrar apenas alertas não dispensados e ordenar por severidade
      const activeAlerts = criticalAlerts
        .filter(alert => !alert.dismissed)
        .sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });

      setAlerts(activeAlerts);
    } catch (error) {
      console.error('Erro ao buscar alertas críticos:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, dismissed: true }
          : alert
      ).filter(alert => !alert.dismissed)
    );
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  const totalCount = alerts.length;

  if (loading) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Ações Necessárias
          </CardTitle>
          <CardDescription>Situações críticas que requerem atenção imediata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <p className="text-muted-foreground">Carregando alertas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Ações Necessárias
          </CardTitle>
          <CardDescription>Nenhuma situação crítica detectada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-green-700 font-medium">Tudo sob controle!</p>
            <p className="text-sm text-muted-foreground">Não há alertas críticos no momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              Ações Necessárias
            </CardTitle>
            <CardDescription>
              {criticalCount} crítico{criticalCount !== 1 ? 's' : ''} • 
              {highCount} alta prioridade • 
              {totalCount} total
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} CRÍTICO{criticalCount > 1 ? 'S' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.map((alert) => {
            const IconComponent = ALERT_ICONS[alert.type];
            
            return (
              <Alert 
                key={alert.id} 
                className={`${ALERT_COLORS[alert.severity]} border-l-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <IconComponent className="h-5 w-5 mt-0.5" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${SEVERITY_COLORS[alert.severity]}`}
                        >
                          {alert.severity === 'critical' && 'CRÍTICO'}
                          {alert.severity === 'high' && 'ALTA'}
                          {alert.severity === 'medium' && 'MÉDIA'}
                        </Badge>
                      </div>
                      
                      <AlertDescription className="text-sm mb-2">
                        <strong>{alert.clientName}</strong>
                        {alert.policyNumber && ` • Apólice ${alert.policyNumber}`}
                        <br />
                        {alert.description}
                      </AlertDescription>
                      
                      <div className="bg-white/50 rounded p-2 mb-3">
                        <p className="text-xs font-medium text-blue-700">
                          <strong>Ação requerida:</strong> {alert.actionRequired}
                        </p>
                        {alert.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Prazo: {format(alert.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          Contatar
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}