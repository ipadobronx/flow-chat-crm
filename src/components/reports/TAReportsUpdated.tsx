import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTACache } from "@/hooks/useTACache";
import { TADateFilter } from "./TADateFilter";
import { TAMetricCard } from "./TAMetricCard";
import TADynamicChart from "./TADynamicChart";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { RefreshCw } from "lucide-react";

interface TAMetrics {
  total_contactados: number;
  nao_atendeu: number;
  ligar_depois: number;
  marcar_whatsapp: number;
  agendados: number;
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
}

export function TAReportsUpdated() {
  const { user } = useAuth();
  const { invalidateTAData } = useTACache();
  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());
  const [activeCard, setActiveCard] = useState<string>('leadsContactados');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch TA dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['ta-dashboard', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const period = `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`;
      const { data, error } = await supabase.rpc('get_ta_dashboard', {
        p_user_id: user.id,
        p_period: period
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
      
      const period = `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`;
      const { data, error } = await supabase.rpc('get_ta_temporal_data', {
        p_user_id: user.id,
        p_period: period
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch efficiency metrics
  const { data: efficiencyData } = useQuery({
    queryKey: ['ta-efficiency', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_ta_efficiency_metrics', {
        p_user_id: user.id,
        p_period: '30 days'
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
            existingData.contatosEfetuados += item.total;
            break;
        }
      }
    });

    return Array.from(dateMap.values());
  };

  const chartData = processTemporalData();

  const handlePresetChange = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'hoje':
        setStartDate(today);
        setEndDate(today);
        break;
      case '7dias':
        setStartDate(subDays(today, 6));
        setEndDate(today);
        break;
      case '30dias':
        setStartDate(subDays(today, 29));
        setEndDate(today);
        break;
      case '90dias':
        setStartDate(subDays(today, 89));
        setEndDate(today);
        break;
    }
  };

  const handlePeriodChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
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
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onPresetChange={handlePresetChange}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TAMetricCard
          title="Leads Contactados"
          value={dashboardData?.total_contactados || 0}
          isActive={activeCard === 'leadsContactados'}
          onClick={() => setActiveCard('leadsContactados')}
        />
        <TAMetricCard
          title="Marcar no WhatsApp"
          value={dashboardData?.marcar_whatsapp || 0}
          isActive={activeCard === 'marcarWhatsapp'}
          onClick={() => setActiveCard('marcarWhatsapp')}
        />
        <TAMetricCard
          title="Ligar Depois"
          value={dashboardData?.ligar_depois || 0}
          isActive={activeCard === 'ligarDepois'}
          onClick={() => setActiveCard('ligarDepois')}
        />
        <TAMetricCard
          title="Agendados (OI)"
          value={dashboardData?.agendados || 0}
          isActive={activeCard === 'resultadoGeral'}
          onClick={() => setActiveCard('resultadoGeral')}
        />
      </div>

      {/* Dynamic Chart */}
      <TADynamicChart
        activeCard={activeCard}
        data={{
          leadsContactados: chartData,
          marcarWhatsapp: chartData,
          ligarDepois: chartData,
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eficiência por Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {efficiencyData.leads_por_agendamento || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                leads contactados por agendamento
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa Marcar → OI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {efficiencyData.taxa_conversao_marcar_oi || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                conversão de "Marcar" para "OI"
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa Conversão Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {efficiencyData.taxa_conversao_geral || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                taxa geral de agendamentos
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}