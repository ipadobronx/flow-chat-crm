import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      // Get security status using secure function (limited data for UI)
      const { data: securityStatus, error } = await supabase
        .rpc('get_security_status');

      if (error) {
        throw error;
      }

      const statusData = securityStatus?.[0];
      
      const result: SecurityCheckResult = {
        hasErrors: statusData?.has_errors || false,
        hasWarnings: statusData?.has_warnings || false,
        errorCount: statusData?.error_count || 0,
        warningCount: statusData?.warning_count || 0,
        lastCheck: new Date(),
        isChecking: false,
      };
      
      setSecurityStatus(result);
      
      // Security checks completed without user notification
      
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