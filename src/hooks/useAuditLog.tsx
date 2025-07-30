import { useAuth } from "./useAuth";
import { createAuditLog, SECURITY_CONFIG, type AuditLogEntry } from "@/lib/security";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for audit logging of sensitive operations
 */
export function useAuditLog() {
  const { user } = useAuth();

  const logOperation = async (
    action: typeof SECURITY_CONFIG.SENSITIVE_OPERATIONS[number],
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    if (!user) {
      console.warn('Attempted to log operation without authenticated user');
      return;
    }

    try {
      const auditEntry = createAuditLog(
        user.id,
        action,
        resourceType,
        resourceId,
        details
      );

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Audit Log:', auditEntry);
      }

      // Store in Supabase audit_logs table
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: auditEntry.action,
          resource_type: auditEntry.resource_type,
          resource_id: auditEntry.resource_id,
          details: auditEntry.details,
          ip_address: auditEntry.ip_address,
          user_agent: auditEntry.user_agent
        });

      if (error) {
        console.error('Failed to store audit log in database:', error);
        // Fallback to localStorage in case of database error
        const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        existingLogs.push(auditEntry);
        const trimmedLogs = existingLogs.slice(-100);
        localStorage.setItem('audit_logs', JSON.stringify(trimmedLogs));
      }

    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  };

  const logLeadStatusChange = (leadId: string, oldStatus: string, newStatus: string) => {
    logOperation('lead_status_change', 'lead', leadId, {
      old_status: oldStatus,
      new_status: newStatus
    });
  };

  const logSitPlanSelection = (leadIds: string[]) => {
    logOperation('sitplan_selection', 'sitplan', undefined, {
      selected_leads: leadIds,
      selection_count: leadIds.length
    });
  };

  const logTAAssignment = (leadIds: string[]) => {
    logOperation('ta_assignment', 'ta', undefined, {
      assigned_leads: leadIds,
      assignment_count: leadIds.length
    });
  };

  const logUserLogin = () => {
    logOperation('user_login', 'auth', user?.id);
  };

  const logUserLogout = () => {
    logOperation('user_logout', 'auth', user?.id);
  };

  return {
    logOperation,
    logLeadStatusChange,
    logSitPlanSelection,
    logTAAssignment,
    logUserLogin,
    logUserLogout,
  };
}
