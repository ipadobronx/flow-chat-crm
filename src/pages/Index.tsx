import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { LeadsChart } from "@/components/dashboard/charts/LeadsChart";
import { ConversionChart } from "@/components/dashboard/charts/ConversionChart";
import { DemographicsCharts } from "@/components/dashboard/charts/DemographicsCharts";
import { StagePerformanceChart } from "@/components/dashboard/charts/StagePerformanceChart";
import { DailyActivityChart } from "@/components/dashboard/charts/DailyActivityChart";
import { SalesPipelineChart } from "@/components/dashboard/charts/SalesPipelineChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BirthdayCard } from "@/components/dashboard/BirthdayCard";
import { LigacoesHoje } from "@/components/dashboard/LigacoesHoje";

const Index = () => {
  // Definir o dia atual como padrão
  const today = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(today);
  const [endDate, setEndDate] = useState<Date | undefined>(today);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="space-y-2 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard de Vendas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Insights em tempo real sobre seu desempenho de vendas</p>
          </div>
          <DateFilter 
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
        
        <KPIGrid startDate={startDate} endDate={endDate} />
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <LeadsChart startDate={startDate} endDate={endDate} />
          <ConversionChart startDate={startDate} endDate={endDate} />
        </div>
        
        {/* Novos Gráficos com dados reais */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <StagePerformanceChart startDate={startDate} endDate={endDate} />
          <DailyActivityChart startDate={startDate} endDate={endDate} />
          <SalesPipelineChart startDate={startDate} endDate={endDate} />
        </div>
        
        {/* Gráficos Demográficos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Demografia dos Leads</h2>
          <Tabs defaultValue="clientes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="recs">Recomendações</TabsTrigger>
            </TabsList>
            <TabsContent value="clientes" className="space-y-4">
              <DemographicsCharts 
                startDate={startDate} 
                endDate={endDate} 
                type="clientes" 
              />
            </TabsContent>
            <TabsContent value="recs" className="space-y-4">
              <DemographicsCharts 
                startDate={startDate} 
                endDate={endDate} 
                type="recs" 
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <ActivityFeed />
          </div>
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <BirthdayCard />
            <LigacoesHoje />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
