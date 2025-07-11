import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { LeadsChart } from "@/components/dashboard/charts/LeadsChart";
import { ConversionChart } from "@/components/dashboard/charts/ConversionChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { LeadsTable } from "@/components/dashboard/LeadsTable";

const Index = () => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Vendas</h1>
            <p className="text-muted-foreground">Insights em tempo real sobre seu desempenho de vendas</p>
          </div>
          <DateFilter 
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
        <KPIGrid startDate={startDate} endDate={endDate} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadsChart />
          <ConversionChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><LeadsTable /></div>
          <div className="lg:col-span-1"><ActivityFeed /></div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
