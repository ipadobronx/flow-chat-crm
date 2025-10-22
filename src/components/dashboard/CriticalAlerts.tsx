import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CreditCard, 
  UserX, 
  Clock, 
  Phone, 
  ExternalLink,
  X
} from "lucide-react";
import { useCriticalAlerts } from "@/hooks/dashboard/useCriticalAlerts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const ALERT_ICONS = {
  stalled_deal: Clock,
  missed_call: Phone,
  callback_pending: AlertTriangle,
  contract_expiry: CreditCard,
  payment_failure: CreditCard,
  health_rejection: UserX,
};

const ALERT_COLORS = {
  critical: "border-red-500 bg-red-50",
  high: "border-orange-500 bg-orange-50",
  medium: "border-yellow-500 bg-yellow-50",
  low: "border-blue-500 bg-blue-50",
};

const SEVERITY_COLORS = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

export function CriticalAlerts() {
  const { data: alerts = [], isLoading } = useCriticalAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));
  const criticalCount = visibleAlerts.filter(a => a.severidade === 'critical').length;
  const highCount = visibleAlerts.filter(a => a.severidade === 'high').length;
  const totalCount = visibleAlerts.length;

  if (isLoading) {
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
          {visibleAlerts.map((alert) => {
            const IconComponent = ALERT_ICONS[alert.tipo_alerta as keyof typeof ALERT_ICONS] || AlertTriangle;
            
            return (
              <Alert 
                key={alert.id} 
                className={`${ALERT_COLORS[alert.severidade]} border-l-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <IconComponent className="h-5 w-5 mt-0.5" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{alert.titulo}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${SEVERITY_COLORS[alert.severidade]}`}
                        >
                          {alert.severidade === 'critical' && 'CRÍTICO'}
                          {alert.severidade === 'high' && 'ALTA'}
                          {alert.severidade === 'medium' && 'MÉDIA'}
                        </Badge>
                      </div>
                      
                      <AlertDescription className="text-sm mb-2">
                        <strong>{alert.lead_nome}</strong>
                        <br />
                        {alert.descricao}
                      </AlertDescription>
                      
                      <div className="bg-white/50 rounded p-2 mb-3">
                        <p className="text-xs font-medium text-blue-700">
                          <strong>Ação requerida:</strong> {alert.acao_requerida}
                        </p>
                        {alert.due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Prazo: {format(parseISO(alert.due_date), "dd/MM/yyyy", { locale: ptBR })}
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
