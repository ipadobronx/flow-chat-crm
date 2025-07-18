import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SitPlanLeadsTable } from "@/components/sitplan/SitPlanLeadsTable";
import { TALeadsCard } from "@/components/sitplan/TALeadsCard";

export default function SitPlan() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">SIT PLAN</h1>
        </div>
        
        {/* Card principal com scroll limitado */}
        <div className="max-h-[60vh] overflow-auto">
          <SitPlanLeadsTable />
        </div>
        
        {/* Card de leads selecionados para TA */}
        <TALeadsCard />
      </div>
    </DashboardLayout>
  );
}