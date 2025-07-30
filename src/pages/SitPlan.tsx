import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SitPlanLeadsTable } from "@/components/sitplan/SitPlanLeadsTable";
import { TALeadsCard } from "@/components/sitplan/TALeadsCard";
import { SelecionadosCard } from "@/components/sitplan/SelecionadosCard";
import { GlareCard } from "@/components/ui/glare-card";
import { ShineBorder } from "@/components/ui/shine-border";

export default function SitPlan() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header com efeito moderno */}
        <div className="flex items-center justify-between mb-8">
          <ShineBorder
            className="relative rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm"
            color={["#8B5CF6", "#06B6D4", "#10B981"]}
          >
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent px-6 py-3">
              SIT PLAN
            </h1>
          </ShineBorder>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Card principal expandido (ocupa 3 colunas) */}
          <div className="xl:col-span-3">
            <GlareCard className="h-full">
              <SitPlanLeadsTable />
            </GlareCard>
          </div>
          
          {/* Sidebar com cards compactos */}
          <div className="xl:col-span-1 space-y-6">
            <SelecionadosCard />
            <TALeadsCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}