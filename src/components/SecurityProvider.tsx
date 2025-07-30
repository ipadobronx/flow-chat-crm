import { createContext, useContext, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { validateSession } from "@/lib/security";

interface SecurityContextType {
  isSessionValid: boolean;
  logSecureOperation: (operation: string, details?: Record<string, any>) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { logUserLogin, logOperation } = useAuditLog();

  useEffect(() => {
    if (user) {
      // Log successful login
      logUserLogin();
      
      // Set up session validation interval
      const interval = setInterval(() => {
        const sessionStart = parseInt(localStorage.getItem('session_start') || '0');
        if (sessionStart && !validateSession(sessionStart)) {
          console.warn('Session expired, signing out');
          signOut();
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      // Store session start time
      if (!localStorage.getItem('session_start')) {
        localStorage.setItem('session_start', Date.now().toString());
      }

      return () => clearInterval(interval);
    } else {
      // Clear session data when user logs out
      localStorage.removeItem('session_start');
    }
  }, [user, logUserLogin, signOut]);

  const isSessionValid = () => {
    if (!user) return false;
    const sessionStart = parseInt(localStorage.getItem('session_start') || '0');
    return sessionStart ? validateSession(sessionStart) : false;
  };

  const logSecureOperation = (operation: string, details?: Record<string, any>) => {
    if (user) {
      logOperation(operation as any, 'system', undefined, details);
    }
  };

  return (
    <SecurityContext.Provider value={{
      isSessionValid: isSessionValid(),
      logSecureOperation,
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}