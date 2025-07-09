import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SitPlanLeadsList } from "@/components/sitplan/SitPlanLeadsList";
import { SitPlanLeadDetails } from "@/components/sitplan/SitPlanLeadDetails";
import { SitPlanSchedule } from "@/components/sitplan/SitPlanSchedule";
import { SitPlanCharts } from "@/components/sitplan/SitPlanCharts";
import { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

export default function SitPlan() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SIT PLAN</h1>
            <p className="text-muted-foreground">Sexta-feira - Ligações Estratégicas</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Main Layout - 3 Sections */}
        <div className="grid grid-cols-12 gap-6 min-h-[600px]">
          {/* Left: Leads List */}
          <div className="col-span-4">
            <SitPlanLeadsList 
              selectedLead={selectedLead}
              onSelectLead={setSelectedLead}
            />
          </div>

          {/* Center: Lead Details */}
          <div className="col-span-5">
            <SitPlanLeadDetails 
              selectedLead={selectedLead}
              onLeadUpdated={() => {
                // Refresh the leads list
                setSelectedLead(null);
              }}
            />
          </div>

          {/* Right: Schedule */}
          <div className="col-span-3">
            <SitPlanSchedule />
          </div>
        </div>

        {/* Bottom: Charts */}
        <div className="mt-8">
          <SitPlanCharts />
        </div>
      </div>
    </DashboardLayout>
  );
}