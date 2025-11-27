import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LiquidGlassInput from "@/components/ui/liquid-input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTACache } from "@/hooks/useTACache";
import { TADateFilter } from "./TADateFilter";
import { TAMetricCardGlass } from "./TAMetricCardGlass";
import { DonutChart, DonutChartSegment } from "@/components/ui/donut-chart";
import { TAComparisonChart } from "./TAComparisonChart";
import TADynamicChart from "./TADynamicChart";
import { format, subDays } from "date-fns";
import { RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";
import { useIsTablet } from "@/hooks/use-tablet";
import { cn } from "@/lib/utils";

interface TAMetrics {
  total_contactados: number;
  nao_atendeu: number;
  ligar_depois: number;
  marcar_whatsapp: number;
  agendados: number;
  nao_tem_interesse: number;
}

interface TAEfficiencyMetrics {
  total_contactados: number;
  agendados: number;
  leads_por_agendamento: number;
  taxa_conversao_marcar_oi: number;
  taxa_conversao_geral: number;
}

interface ChartDataPoint {
  date: string;
  contatosEfetuados: number;
  ligacoesNaoAtendidas: number;
  marcarWhatsapp: number;
  ligarDepois: number;
  oi: number;
  naoTemInteresse: number;
}

// Cores das etapas do funil (Pipeline)
const STAGE_COLORS = {
  contactados: "bg-blue-500",
  naoAtendido: "bg-zinc-500",
  ligarDepois: "bg-red-600",
  marcar: "bg-orange-500",
  naoTemInteresse: "bg-purple-500",
  oi: "bg-indigo-500",
};

const DONUT_COLORS = {
  naoAtendido: "#71717a", // zinc-500
  ligarDepois: "#dc2626", // red-600
  marcar: "#f97316", // orange-500
  naoTemInteresse: "#a855f7", // purple-500
  oi: "#6366f1", // indigo-500
};

export function TAReportsUpdated() {
  const { user } = useAuth();
  const { isTablet } = useIsTablet();
  const { invalidateTAData } = useTACache();
  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());
  const [activeCard, setActiveCard] = useState<string>('leadsContactados');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [preset, setPreset] = useState<string>("7dias");
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('ta_weekly_goal');
    return saved ? parseInt(saved) : 0;
  });

  // Calculate previous period dates
  const periodFilter = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const previousStart = subDays(startDate, periodFilter);
  const previousEnd = subDays(endDate, periodFilter);

  // Fetch TA dashboard data - Current Period
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['ta-dashboard', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_ta_dashboard_by_date_range', {
        p_user_id: user.id,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return data?.[0] as TAMetrics;
    },
    enabled: !!user?.id,
  });

  // Fetch TA dashboard data - Previous Period
  const { data: previousDashboardData } = useQuery({
    queryKey: ['ta-dashboard-previous', user?.id, previousStart, previousEnd],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_ta_dashboard_by_date_range', {
        p_user_id: user.id,
        p_start_date: format(previousStart, 'yyyy-MM-dd'),
        p_end_date: format(previousEnd, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return data?.[0] as TAMetrics;
    },
    enabled: !!user?.id,
  });

  // Fetch TA temporal data for charts
  const { data: temporalData, isLoading: isTemporalLoading } = useQuery({
    queryKey: ['ta-temporal', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc('get_ta_temporal_data_by_date_range', {
        p_user_id: user.id,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch efficiency metrics
  const { data: efficiencyData } = useQuery({
    queryKey: ['ta-efficiency', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_ta_efficiency_metrics_by_date_range', {
        p_user_id: user.id,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return data?.[0] as TAEfficiencyMetrics;
    },
    enabled: !!user?.id,
  });

  // Process temporal data into chart format
  const processTemporalData = (): ChartDataPoint[] => {
    if (!temporalData) return [];

    const dateMap = new Map<string, ChartDataPoint>();
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = format(current, 'yyyy-MM-dd');
      dateMap.set(dateKey, {
        date: format(current, 'dd/MM'),
        contatosEfetuados: 0,
        ligacoesNaoAtendidas: 0,
        marcarWhatsapp: 0,
        ligarDepois: 0,
        oi: 0,
        naoTemInteresse: 0,
      });
      current.setDate(current.getDate() + 1);
    }

    temporalData.forEach((item: any) => {
      const existingData = dateMap.get(item.date);
      if (existingData) {
        switch (item.etapa) {
          case 'NAO_ATENDIDO':
            existingData.ligacoesNaoAtendidas = item.total;
            existingData.contatosEfetuados += item.total;
            break;
          case 'MARCAR':
            existingData.marcarWhatsapp = item.total;
            existingData.contatosEfetuados += item.total;
            break;
          case 'LIGAR_DEPOIS':
            existingData.ligarDepois = item.total;
            existingData.contatosEfetuados += item.total;
            break;
          case 'OI':
            existingData.oi = item.total;
            existingData.contatosEfetuados += item.total;
            break;
          case 'NAO_TEM_INTERESSE':
            existingData.naoTemInteresse = item.total;
            existingData.contatosEfetuados += item.total;
            break;
        }
      }
    });

    return Array.from(dateMap.values());
  };

  const chartData = processTemporalData();

  const handlePresetChange = (preset: string) => {
    setPreset(preset);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) setStartDate(date);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) setEndDate(date);
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await invalidateTAData();
    setIsRefreshing(false);
  };

  const handleSaveGoal = () => {
    localStorage.setItem('ta_weekly_goal', weeklyGoal.toString());
    toast.success('Meta semanal salva com sucesso!');
  };

  const calculateLeadsNeeded = (): number => {
    if (!efficiencyData || !weeklyGoal || weeklyGoal === 0) return 0;
    if (efficiencyData.taxa_conversao_geral === 0) return 0;
    
    const leadsNeeded = Math.ceil(weeklyGoal / (efficiencyData.taxa_conversao_geral / 100));
    return leadsNeeded;
  };

  const isLoading = isDashboardLoading || isTemporalLoading;

  // Donut chart data
  const donutData: DonutChartSegment[] = [
    { value: dashboardData?.nao_atendeu || 0, color: DONUT_COLORS.naoAtendido, label: "Não Atendido" },
    { value: dashboardData?.ligar_depois || 0, color: DONUT_COLORS.ligarDepois, label: "Ligar Depois" },
    { value: dashboardData?.marcar_whatsapp || 0, color: DONUT_COLORS.marcar, label: "Marcar WhatsApp" },
    { value: dashboardData?.nao_tem_interesse || 0, color: DONUT_COLORS.naoTemInteresse, label: "Não Tem Interesse" },
    { value: dashboardData?.agendados || 0, color: DONUT_COLORS.oi, label: "OI Agendado" },
  ];

  // Tablet liquid glass classes
  const cardClasses = cn(
    "rounded-[20px]",
    isTablet && "bg-white/5 backdrop-blur-md border-white/10"
  );

  const titleClasses = cn(isTablet && "text-white");
  const subtitleClasses = cn(isTablet ? "text-white/50" : "text-muted-foreground");

  const currentPeriod = `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`;
  const previousPeriod = `${format(previousStart, 'dd/MM')} - ${format(previousEnd, 'dd/MM')}`;

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", titleClasses)}>
        <div className={cn("animate-spin rounded-full h-8 w-8 border-b-2", isTablet ? "border-[#d4ff4a]" : "border-primary")}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", titleClasses)}>Relatórios TA</h1>
          <p className={subtitleClasses}>
            Análise detalhada das atividades de telemarketing e atendimento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className={cn("flex items-center gap-2", isTablet && "bg-white/10 border-white/20 text-white hover:bg-white/20")}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Badge variant="secondary" className={cn("text-sm", isTablet && "bg-white/10 text-white border-white/20")}>
            {dashboardData?.total_contactados || 0} contatos
          </Badge>
        </div>
      </div>

      {/* Date Filter */}
      <TADateFilter
        startDate={startDate}
        endDate={endDate}
        preset={preset}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onPresetChange={handlePresetChange}
      />

      {/* Metrics Cards - Liquid Glass */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <TAMetricCardGlass
          title="Leads Contactados"
          value={dashboardData?.total_contactados || 0}
          previousValue={previousDashboardData?.total_contactados}
          stageColor={STAGE_COLORS.contactados}
          isActive={activeCard === 'leadsContactados'}
          onClick={() => setActiveCard('leadsContactados')}
        />
        <TAMetricCardGlass
          title="Não Atendido"
          value={dashboardData?.nao_atendeu || 0}
          previousValue={previousDashboardData?.nao_atendeu}
          stageColor={STAGE_COLORS.naoAtendido}
          isActive={activeCard === 'naoAtendido'}
          onClick={() => setActiveCard('naoAtendido')}
        />
        <TAMetricCardGlass
          title="Ligar Depois"
          value={dashboardData?.ligar_depois || 0}
          previousValue={previousDashboardData?.ligar_depois}
          stageColor={STAGE_COLORS.ligarDepois}
          isActive={activeCard === 'ligarDepois'}
          onClick={() => setActiveCard('ligarDepois')}
        />
        <TAMetricCardGlass
          title="Marcar no WhatsApp"
          value={dashboardData?.marcar_whatsapp || 0}
          previousValue={previousDashboardData?.marcar_whatsapp}
          stageColor={STAGE_COLORS.marcar}
          isActive={activeCard === 'marcarWhatsapp'}
          onClick={() => setActiveCard('marcarWhatsapp')}
        />
        <TAMetricCardGlass
          title="Não Tem Interesse"
          value={dashboardData?.nao_tem_interesse || 0}
          previousValue={previousDashboardData?.nao_tem_interesse}
          stageColor={STAGE_COLORS.naoTemInteresse}
          isActive={activeCard === 'naoTemInteresse'}
          onClick={() => setActiveCard('naoTemInteresse')}
        />
        <TAMetricCardGlass
          title="OI Agendado"
          value={dashboardData?.agendados || 0}
          previousValue={previousDashboardData?.agendados}
          stageColor={STAGE_COLORS.oi}
          isActive={activeCard === 'resultadoGeral'}
          onClick={() => setActiveCard('resultadoGeral')}
        />
      </div>

      {/* DonutChart + Comparison Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DonutChart */}
        <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md p-6">
          <div className="mb-4">
            <h3 className="text-lg font-inter font-normal tracking-tight text-foreground">
              Distribuição de Resultados
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Visualização por etapa de atendimento
            </p>
          </div>

          <div className="flex flex-col items-center">
            <DonutChart
              data={donutData}
              size={220}
              strokeWidth={28}
              centerContent={
                <div className="text-center">
                  <p className="text-3xl font-inter font-bold tracking-tighter text-foreground">
                    {dashboardData?.total_contactados || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              }
            />

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 w-full">
              {donutData.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <TAComparisonChart
          currentOIs={dashboardData?.agendados || 0}
          previousOIs={previousDashboardData?.agendados || 0}
          currentPeriod={currentPeriod}
          previousPeriod={previousPeriod}
        />
      </div>

      {/* Dynamic Chart */}
      <TADynamicChart
        activeCard={activeCard}
        data={{
          leadsContactados: chartData,
          naoAtendido: chartData,
          marcarWhatsapp: chartData,
          ligarDepois: chartData,
          naoTemInteresse: chartData,
          resultadoGeral: chartData,
        }}
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        periodFilter={periodFilter}
        isLoading={isLoading}
      />

      {/* Efficiency Metrics */}
      {efficiencyData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cardClasses}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-sm font-medium flex items-center gap-2", titleClasses)}>
                <Target className={cn("h-4 w-4", isTablet && "text-[#d4ff4a]")} />
                Calculadora de Meta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", titleClasses)}>
                  Qual a sua meta de OIs semanais?
                </label>
                <div className="flex gap-2">
                  <LiquidGlassInput
                    type="number"
                    min="0"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 0)}
                    placeholder="Digite sua meta"
                    className="flex-1"
                  />
                  <Button onClick={handleSaveGoal} size="sm" className={cn(isTablet && "bg-[#d4ff4a] text-black hover:bg-[#c9f035]")}>
                    Salvar
                  </Button>
                </div>
              </div>
              
              {weeklyGoal > 0 && efficiencyData.taxa_conversao_geral > 0 && (
                <div className={cn("pt-2 border-t", isTablet && "border-white/10")}>
                  <p className={cn("text-xs mb-1", subtitleClasses)}>
                    Para alcançar sua meta:
                  </p>
                  <div className={cn("text-2xl font-bold", isTablet ? "text-[#d4ff4a]" : "text-primary")}>
                    {calculateLeadsNeeded()}
                  </div>
                  <p className={cn("text-xs", subtitleClasses)}>
                    leads precisam ser contactados por semana
                  </p>
                </div>
              )}
              
              {weeklyGoal > 0 && efficiencyData.taxa_conversao_geral === 0 && (
                <p className={cn("text-xs", subtitleClasses)}>
                  Sem dados de conversão suficientes para calcular
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card className={cardClasses}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm font-medium text-center", titleClasses)}>Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className={cn("text-2xl font-bold", titleClasses)}>
                {efficiencyData.taxa_conversao_marcar_oi || 0}%
              </div>
              <p className={cn("text-xs", subtitleClasses)}>
                Conversão De: OI → Leads Contactados
              </p>
            </CardContent>
          </Card>
          
          <Card className={cardClasses}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm font-medium", titleClasses)}>Taxa de Conversão por Etapa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardData && dashboardData.total_contactados > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className={cn("text-xs", subtitleClasses)}>Não Atendido:</span>
                    <span className={cn("text-sm font-semibold", titleClasses)}>
                      {((dashboardData.nao_atendeu / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn("text-xs", subtitleClasses)}>Ligar Depois:</span>
                    <span className={cn("text-sm font-semibold", titleClasses)}>
                      {((dashboardData.ligar_depois / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn("text-xs", subtitleClasses)}>Marcar WhatsApp:</span>
                    <span className={cn("text-sm font-semibold", titleClasses)}>
                      {((dashboardData.marcar_whatsapp / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn("text-xs", subtitleClasses)}>Não Tem Interesse:</span>
                    <span className={cn("text-sm font-semibold", titleClasses)}>
                      {((dashboardData.nao_tem_interesse / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={cn("flex justify-between items-center pt-2 border-t", isTablet && "border-white/10")}>
                    <span className={cn("text-xs font-medium", titleClasses)}>OI Agendado:</span>
                    <span className={cn("text-sm font-bold", isTablet ? "text-[#d4ff4a]" : "text-primary")}>
                      {((dashboardData.agendados / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
