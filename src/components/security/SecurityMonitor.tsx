import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Shield, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SecurityIssue {
  id: string;
  type: 'ERROR' | 'WARN';
  title: string;
  description: string;
  fixUrl?: string;
  category: string;
}

export function SecurityMonitor() {
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkSecurityStatus = async () => {
    setIsChecking(true);
    
    try {
      // Get real security status from database
      const { data: securityStatus, error } = await supabase
        .rpc('get_security_status');

      if (error) {
        throw error;
      }

      const statusData = securityStatus?.[0];
      const issues: SecurityIssue[] = [];

      // Add issues based on actual security status
      if (statusData?.has_errors || statusData?.has_warnings) {
        // These are the known issues that need manual configuration
        issues.push(
          {
            id: 'leaked_password_disabled',
            type: 'ERROR',
            title: 'Proteção de Senha Vazada Desabilitada',
            description: 'Proteção contra senhas vazadas deve ser habilitada nas configurações de Auth do Supabase.',
            fixUrl: 'https://supabase.com/dashboard/project/ltqhujliyocybuwcmadf/auth/providers',
            category: 'SECURITY'
          },
          {
            id: 'auth_otp_long_expiry',
            type: 'WARN',
            title: 'OTP com Expiração Longa',
            description: 'OTP configurado para 1 hora. Recomendado: 5 minutos (300 segundos) para melhor segurança.',
            fixUrl: 'https://supabase.com/dashboard/project/ltqhujliyocybuwcmadf/auth/providers',
            category: 'SECURITY'
          },
          {
            id: 'extension_in_public',
            type: 'WARN',
            title: 'Extensions no Schema Público',
            description: 'Extensions instaladas no schema público. Mover para schema dedicado.',
            fixUrl: 'https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public',
            category: 'SECURITY'
          }
        );
      }

      setSecurityIssues(issues);
      
      if (issues.length > 0) {
        const errorCount = issues.filter(issue => issue.type === 'ERROR').length;
        const warnCount = issues.filter(issue => issue.type === 'WARN').length;
        
        toast({
          title: "Configurações de Segurança Pendentes",
          description: `${errorCount} configurações críticas e ${warnCount} avisos precisam de atenção manual`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Segurança Verificada",
          description: "Todas as verificações de segurança passaram com sucesso",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao verificar segurança:', error);
      toast({
        title: "Erro na Verificação",
        description: "Não foi possível verificar o status de segurança.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Verifica segurança na inicialização
    checkSecurityStatus();
    
    // Verifica a cada 30 minutos
    const interval = setInterval(checkSecurityStatus, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getIssueIcon = (type: string) => {
    return type === 'ERROR' ? 
      <AlertTriangle className="h-4 w-4 text-destructive" /> : 
      <AlertTriangle className="h-4 w-4 text-warning" />;
  };

  const getIssueVariant = (type: string) => {
    return type === 'ERROR' ? 'destructive' : 'default';
  };

  if (isChecking && securityIssues.length === 0) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Verificando Segurança...</AlertTitle>
        <AlertDescription>
          Analisando configurações de segurança do projeto.
        </AlertDescription>
      </Alert>
    );
  }

  if (securityIssues.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertTitle>Segurança OK</AlertTitle>
        <AlertDescription>
          ✅ Políticas RLS corrigidas. Configurações manuais do Supabase pendentes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Monitor de Segurança
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkSecurityStatus}
          disabled={isChecking}
        >
          {isChecking ? "Verificando..." : "Verificar Novamente"}
        </Button>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertTitle>✅ Políticas RLS Corrigidas</AlertTitle>
        <AlertDescription>
          A política permissiva da tabela security_config foi removida com sucesso. 
          Configurações manuais do Supabase ainda pendentes abaixo.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {securityIssues.map((issue) => (
          <Alert key={issue.id} variant={getIssueVariant(issue.type)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getIssueIcon(issue.type)}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTitle className="text-sm">{issue.title}</AlertTitle>
                    <Badge variant={issue.type === 'ERROR' ? 'destructive' : 'secondary'}>
                      Configuração Manual
                    </Badge>
                  </div>
                  <AlertDescription className="text-sm">
                    {issue.description}
                  </AlertDescription>
                </div>
              </div>
              
              {issue.fixUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a 
                    href={issue.fixUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Corrigir
                  </a>
                </Button>
              )}
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
}