import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SitPlanSidebar } from "@/components/sitplan/SitPlanSidebar";
import { SitPlanMainPanel } from "@/components/sitplan/SitPlanMainPanel";
import { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

export default function SitPlan() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-border bg-background">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            SIT PLAN
          </h1>
        </div>

        {/* Two Column Layout - Responsive */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row h-full">
          <div className="w-full lg:w-80 flex-shrink-0">
            <SitPlanSidebar 
              selectedLead={selectedLead}
              onSelectLead={setSelectedLead}
            />
          </div>
          <div className="flex-1 min-w-0">
            <SitPlanMainPanel 
              selectedLead={selectedLead}
              onSelectLead={setSelectedLead}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}