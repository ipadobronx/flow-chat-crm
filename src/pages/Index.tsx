import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { SalesFunnelChart } from "@/components/dashboard/SalesFunnelChart";
import { RecsPerWeekChart } from "@/components/dashboard/RecsPerWeekChart";
import { DailySalesActivities } from "@/components/dashboard/DailySalesActivities";
import { FollowUpActivities } from "@/components/dashboard/FollowUpActivities";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useDashboardCache } from "@/hooks/dashboard/useDashboardCache";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  // Definir o dia atual como padrão
  const today = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(today);
  const [endDate, setEndDate] = useState<Date | undefined>(today);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { invalidateAllDashboard } = useDashboardCache();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await invalidateAllDashboard();
      window.location.reload();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="space-y-2 sm:space-y-4">
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
          <DateFilter 
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
        
        <KPIGrid startDate={startDate} endDate={endDate} />
        
        {/* Gráficos principais do funil de vendas */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <SalesFunnelChart startDate={startDate} endDate={endDate} />
          <RecsPerWeekChart startDate={startDate} endDate={endDate} />
        </div>
        
        {/* Seções de atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DailySalesActivities />
          <FollowUpActivities />
        </div>
        
        {/* Alertas críticos no rodapé */}
        <CriticalAlerts />
      </div>
    </DashboardLayout>
  );
};

export default Index;
