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
      // Get security configuration from database
      const { data: securityConfig, error } = await supabase
        .from('security_config')
        .select('*');

      if (error) {
        throw error;
      }

      // Analyze security configuration
      const nonCompliantConfigs = securityConfig?.filter(config => !config.is_compliant) || [];
      const criticalIssues = nonCompliantConfigs.filter(config => 
        config.config_key === 'leaked_password_protection' || 
        config.config_key === 'security_definer_views'
      );
      
      const result: SecurityCheckResult = {
        hasErrors: criticalIssues.length > 0,
        hasWarnings: nonCompliantConfigs.length > criticalIssues.length,
        errorCount: criticalIssues.length,
        warningCount: nonCompliantConfigs.length - criticalIssues.length,
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