import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { SecuritySettings } from "@/components/security/SecuritySettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSecurity } from "@/components/SecurityProvider";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

export default function SecurityDashboard() {
  const { securityStatus } = useSecurity();

  const getOverallStatus = () => {
    if (securityStatus.hasErrors) {
      return {
        label: "Crítico",
        variant: "destructive" as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Problemas críticos detectados que precisam de correção imediata"
      };
    }
    
    if (securityStatus.hasWarnings) {
      return {
        label: "Atenção",
        variant: "secondary" as const,
        icon: <AlertTriangle className="h-4 w-4 text-warning" />,
        description: "Avisos de segurança que devem ser corrigidos"
      };
    }
    
    return {
      label: "Seguro",
      variant: "secondary" as const,
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      description: "Todas as verificações de segurança passaram"
    };
  };

  const status = getOverallStatus();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Dashboard de Segurança
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento e configurações de segurança do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {status.icon}
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>

        {/* Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle>Status Geral de Segurança</CardTitle>
            <CardDescription>{status.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {securityStatus.errorCount}
                </div>
                <div className="text-sm text-muted-foreground">Erros Críticos</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-warning">
                  {securityStatus.warningCount}
                </div>
                <div className="text-sm text-muted-foreground">Avisos</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {securityStatus.isSecure ? '✓' : '✗'}
                </div>
                <div className="text-sm text-muted-foreground">Status Geral</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitor de Segurança */}
        <SecurityMonitor />

        {/* Configurações de Segurança */}
        <SecuritySettings />

        {/* Documentação */}
        <Card>
          <CardHeader>
            <CardTitle>Documentação de Segurança</CardTitle>
            <CardDescription>
              Recursos e guias para manter a segurança do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Guia de Segurança Completo</h4>
                  <p className="text-sm text-muted-foreground">SECURITY.md - Solução definitiva para problemas recorrentes</p>
                </div>
                <Badge variant="outline">Documentação</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Configurações de Ambiente</h4>
                  <p className="text-sm text-muted-foreground">.env.example - Lista de configurações obrigatórias</p>
                </div>
                <Badge variant="outline">Configuração</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Checklist de Deploy</h4>
                  <p className="text-sm text-muted-foreground">Verificações obrigatórias antes do deploy em produção</p>
                </div>
                <Badge variant="outline">Deploy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}