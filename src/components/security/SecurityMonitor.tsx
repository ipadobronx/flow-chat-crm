import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Shield, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SecurityIssue {
  id: string;
  type: 'ERROR' | 'WARN';
  title: string;
  description: string;
  fixUrl?: string;
  category: string;
}

const KNOWN_SECURITY_ISSUES: SecurityIssue[] = [
  {
    id: 'security_definer_view',
    type: 'ERROR',
    title: 'Security Definer View',
    description: 'Views com SECURITY DEFINER detectadas. Podem contornar RLS.',
    fixUrl: 'https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view',
    category: 'SECURITY'
  },
  {
    id: 'extension_in_public',
    type: 'WARN',
    title: 'Extensions no Schema Público',
    description: 'Extensions instaladas no schema público. Mover para schema dedicado.',
    fixUrl: 'https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public',
    category: 'SECURITY'
  },
  {
    id: 'auth_otp_long_expiry',
    type: 'WARN',
    title: 'OTP com Expiração Longa',
    description: 'OTP configurado com tempo de expiração muito longo (>10min).',
    fixUrl: 'https://supabase.com/docs/guides/platform/going-into-prod#security',
    category: 'SECURITY'
  },
  {
    id: 'leaked_password_disabled',
    type: 'WARN',
    title: 'Proteção de Senha Vazada Desabilitada',
    description: 'Proteção contra senhas vazadas está desabilitada.',
    fixUrl: 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection',
    category: 'SECURITY'
  }
];

export function SecurityMonitor() {
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkSecurityStatus = async () => {
    setIsChecking(true);
    
    // Simula verificação - em produção conectaria com API do Supabase
    setTimeout(() => {
      // Por enquanto, sempre mostra os problemas conhecidos
      setSecurityIssues(KNOWN_SECURITY_ISSUES);
      setIsChecking(false);
      
      const errorCount = KNOWN_SECURITY_ISSUES.filter(issue => issue.type === 'ERROR').length;
      const warnCount = KNOWN_SECURITY_ISSUES.filter(issue => issue.type === 'WARN').length;
      
      if (errorCount > 0 || warnCount > 0) {
        toast({
          title: "Problemas de Segurança Detectados",
          description: `${errorCount} erros críticos e ${warnCount} avisos encontrados`,
          variant: "destructive",
        });
      }
    }, 1000);
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
          Todas as verificações de segurança passaram com sucesso.
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
                      {issue.type}
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