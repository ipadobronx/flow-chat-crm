import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface SecurityCheckResult {
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
  lastCheck: Date | null;
  isChecking: boolean;
}

export function useSecurityCheck() {
  const [securityStatus, setSecurityStatus] = useState<SecurityCheckResult>({
    hasErrors: false,
    hasWarnings: false,
    errorCount: 0,
    warningCount: 0,
    lastCheck: null,
    isChecking: false,
  });
  
  const { toast } = useToast();

  const checkSecurity = async () => {
    setSecurityStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Em um ambiente real, isto faria uma chamada para a API do Supabase
      // Por agora, simula os problemas conhecidos baseados no linter
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const knownErrors = 1; // Security Definer View
      const knownWarnings = 4; // Extensions + OTP + Leaked Password
      
      const result: SecurityCheckResult = {
        hasErrors: knownErrors > 0,
        hasWarnings: knownWarnings > 0,
        errorCount: knownErrors,
        warningCount: knownWarnings,
        lastCheck: new Date(),
        isChecking: false,
      };
      
      setSecurityStatus(result);
      
      // Notifica sobre problemas críticos
      if (result.hasErrors) {
        toast({
          title: "🚨 Problemas Críticos de Segurança",
          description: `${result.errorCount} erro(s) crítico(s) detectado(s). Correção urgente necessária.`,
          variant: "destructive",
        });
      } else if (result.hasWarnings) {
        toast({
          title: "⚠️ Avisos de Segurança",
          description: `${result.warningCount} aviso(s) detectado(s). Recomenda-se correção.`,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao verificar segurança:', error);
      setSecurityStatus(prev => ({ ...prev, isChecking: false }));
      
      toast({
        title: "Erro na Verificação",
        description: "Não foi possível verificar o status de segurança.",
        variant: "destructive",
      });
      
      return null;
    }
  };

  // Verificação automática periódica
  useEffect(() => {
    // Verifica imediatamente
    checkSecurity();
    
    // Verifica a cada 30 minutos
    const interval = setInterval(checkSecurity, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Verifica quando a aba se torna ativa novamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSecurity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    ...securityStatus,
    checkSecurity,
    isSecure: !securityStatus.hasErrors && !securityStatus.hasWarnings,
  };
}