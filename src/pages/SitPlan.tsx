import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SitPlanLeadsList } from "@/components/sitplan/SitPlanLeadsList";
import { SitPlanLeadDetails } from "@/components/sitplan/SitPlanLeadDetails";
import { SitPlanCharts } from "@/components/sitplan/SitPlanCharts";
import { SitPlanSchedule } from "@/components/sitplan/SitPlanSchedule";

export default function SitPlan() {
  const [selectedLead, setSelectedLead] = useState(null);

  const handleLeadUpdated = () => {
    // Force refresh of leads list
    setSelectedLead(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">SIT PLAN</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Section */}
          <div className="lg:col-span-2">
            <SitPlanCharts />
          </div>
          
          {/* Schedule Section */}
          <div className="lg:col-span-1">
            <SitPlanSchedule />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Leads List */}
          <div>
            <SitPlanLeadsList 
              selectedLead={selectedLead} 
              onSelectLead={setSelectedLead} 
            />
          </div>
          
          {/* Lead Details */}
          <div>
            {selectedLead ? (
              <SitPlanLeadDetails 
                selectedLead={selectedLead} 
                onLeadUpdated={handleLeadUpdated} 
              />
            ) : (
              <div className="bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                <p className="text-muted-foreground">
                  Selecione um lead para ver os detalhes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}