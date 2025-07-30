import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings, AlertCircle, CheckCircle } from "lucide-react";

interface SecurityConfig {
  name: string;
  description: string;
  status: 'configured' | 'missing' | 'warning';
  dashboardUrl: string;
  instructions: string[];
}

const SECURITY_CONFIGURATIONS: SecurityConfig[] = [
  {
    name: "Proteção de Senha Vazada",
    description: "Previne uso de senhas conhecidas em vazamentos de dados",
    status: 'missing',
    dashboardUrl: "https://supabase.com/dashboard/project/ltqhujliyocybuwcmadf/auth/providers",
    instructions: [
      "Acesse Authentication → Settings",
      "Role até 'Password strength'",
      "Habilite 'Leaked Password Protection'"
    ]
  },
  {
    name: "Tempo de Expiração OTP",
    description: "Define tempo limite para códigos de verificação",
    status: 'warning',
    dashboardUrl: "https://supabase.com/dashboard/project/ltqhujliyocybuwcmadf/auth/providers",
    instructions: [
      "Acesse Authentication → Settings",
      "Role até 'OTP Expiry'",
      "Configure para 300-600 segundos (5-10 minutos)"
    ]
  },
  {
    name: "Extensions Schema",
    description: "Move extensions do schema público para schema dedicado",
    status: 'warning',
    dashboardUrl: "https://supabase.com/dashboard/project/ltqhujliyocybuwcmadf/database/extensions",
    instructions: [
      "Acesse Database → Extensions",
      "Para cada extension marcada como 'public':",
      "Clique nos 3 pontos → 'Move to schema'",
      "Crie ou selecione schema 'extensions'"
    ]
  },
  {
    name: "Security Definer Views",
    description: "Remove ou revisa views com SECURITY DEFINER",
    status: 'missing',
    dashboardUrl: "https://supabase.com/dashboard/project/ltqhujliyocybuwcmadf/sql/new",
    instructions: [
      "Acesse SQL Editor",
      "Execute: SELECT * FROM information_schema.views WHERE security_type = 'DEFINER';",
      "Revise cada view encontrada",
      "Remova ou altere para SECURITY INVOKER se necessário"
    ]
  }
];

export function SecuritySettings() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge variant="secondary" className="text-success">Configurado</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-warning">Atenção</Badge>;
      case 'missing':
        return <Badge variant="destructive">Pendente</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Segurança Obrigatórias
        </CardTitle>
        <CardDescription>
          Configurações que devem ser aplicadas manualmente no Supabase Dashboard para resolver problemas de segurança.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {SECURITY_CONFIGURATIONS.map((config) => (
            <div key={config.name} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.status)}
                  <h4 className="font-medium">{config.name}</h4>
                  {getStatusBadge(config.status)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href={config.dashboardUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir Dashboard
                  </a>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">{config.description}</p>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Passos para configurar:</p>
                <ol className="text-sm text-muted-foreground space-y-1 pl-4">
                  {config.instructions.map((step, index) => (
                    <li key={index} className="list-decimal">{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}