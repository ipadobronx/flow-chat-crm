import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LiquidGlassInput from "@/components/ui/liquid-input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTACache } from "@/hooks/useTACache";
import { TADateFilter } from "./TADateFilter";
import { TAMetricCard } from "./TAMetricCard";
import TADynamicChart from "./TADynamicChart";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";

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

export function TAReportsUpdated() {
  const { user } = useAuth();
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

  // Fetch TA dashboard data
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
    
    // Initialize all dates in the range
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

    // Fill with actual data
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
    
    // Cálculo: Meta de OIs / (Taxa de conversão / 100)
    const leadsNeeded = Math.ceil(weeklyGoal / (efficiencyData.taxa_conversao_geral / 100));
    return leadsNeeded;
  };

  const isLoading = isDashboardLoading || isTemporalLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const periodFilter = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentPeriod = `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`;
  const previousStart = subDays(startDate, periodFilter);
  const previousEnd = subDays(endDate, periodFilter);
  const previousPeriod = `${format(previousStart, 'dd/MM')} - ${format(previousEnd, 'dd/MM')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios TA</h1>
          <p className="text-muted-foreground">
            Análise detalhada das atividades de telemarketing e atendimento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
          </Button>
          <Badge variant="secondary" className="text-sm">
            {dashboardData?.total_contactados || 0} contatos no período
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <TAMetricCard
          title="Leads Contactados"
          value={dashboardData?.total_contactados || 0}
          isActive={activeCard === 'leadsContactados'}
          onClick={() => setActiveCard('leadsContactados')}
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <TAMetricCard
          title="Não Atendido"
          value={dashboardData?.nao_atendeu || 0}
          isActive={activeCard === 'naoAtendido'}
          onClick={() => setActiveCard('naoAtendido')}
          gradient="bg-gradient-to-r from-gray-500 to-gray-600"
        />
        <TAMetricCard
          title="Ligar Depois"
          value={dashboardData?.ligar_depois || 0}
          isActive={activeCard === 'ligarDepois'}
          onClick={() => setActiveCard('ligarDepois')}
          gradient="bg-gradient-to-r from-red-500 to-red-600"
        />
        <TAMetricCard
          title="Marcar no WhatsApp"
          value={dashboardData?.marcar_whatsapp || 0}
          isActive={activeCard === 'marcarWhatsapp'}
          onClick={() => setActiveCard('marcarWhatsapp')}
          gradient="bg-gradient-to-r from-orange-500 to-orange-600"
        />
        <TAMetricCard
          title="Não Tem Interesse"
          value={dashboardData?.nao_tem_interesse || 0}
          isActive={activeCard === 'naoTemInteresse'}
          onClick={() => setActiveCard('naoTemInteresse')}
          gradient="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <TAMetricCard
          title="OI Agendado"
          value={dashboardData?.agendados || 0}
          isActive={activeCard === 'resultadoGeral'}
          onClick={() => setActiveCard('resultadoGeral')}
          gradient="bg-gradient-to-r from-green-500 to-green-600"
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Calculadora de Meta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
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
                  <Button onClick={handleSaveGoal} size="sm">
                    Salvar
                  </Button>
                </div>
              </div>
              
              {weeklyGoal > 0 && efficiencyData.taxa_conversao_geral > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Para alcançar sua meta:
                  </p>
                  <div className="text-2xl font-bold text-primary">
                    {calculateLeadsNeeded()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    leads precisam ser contactados por semana
                  </p>
                </div>
              )}
              
              {weeklyGoal > 0 && efficiencyData.taxa_conversao_geral === 0 && (
                <p className="text-xs text-muted-foreground">
                  Sem dados de conversão suficientes para calcular
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-center">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold">
                {efficiencyData.taxa_conversao_marcar_oi || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Conversão De: OI → Leads Contactados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão por Etapa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardData && dashboardData.total_contactados > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Não Atendido:</span>
                    <span className="text-sm font-semibold">
                      {((dashboardData.nao_atendeu / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Ligar Depois:</span>
                    <span className="text-sm font-semibold">
                      {((dashboardData.ligar_depois / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Marcar WhatsApp:</span>
                    <span className="text-sm font-semibold">
                      {((dashboardData.marcar_whatsapp / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Não Tem Interesse:</span>
                    <span className="text-sm font-semibold">
                      {((dashboardData.nao_tem_interesse / dashboardData.total_contactados) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs font-medium">OI Agendado:</span>
                    <span className="text-sm font-bold text-primary">
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