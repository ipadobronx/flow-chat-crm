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

        {/* Two Column Layout */}
        <div className="flex flex-1 overflow-hidden">
          <SitPlanSidebar 
            selectedLead={selectedLead}
            onSelectLead={setSelectedLead}
          />
          <SitPlanMainPanel 
            selectedLead={selectedLead}
            onSelectLead={setSelectedLead}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}