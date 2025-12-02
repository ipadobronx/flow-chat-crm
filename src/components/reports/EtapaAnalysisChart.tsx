import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { FilterSelect, FilterOption } from "./FilterSelect";
import { getEtapaHex, STAGE_COLORS } from "@/lib/stageColors";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface EtapaMetrics {
  etapa: string;
  total: number;
  percentual: number;
}

interface Props {
  startDate: Date;
  endDate: Date;
  profissaoFilter?: string;
}

// Map display names for better UX
const ETAPA_DISPLAY_NAMES: Record<string, string> = {
  'Todos': 'Todos',
  'Novo': 'Novo',
  'TA': 'TA',
  'Não atendido': 'Não Atendido',
  'Ligar Depois': 'Ligar Depois',
  'Marcar': 'Marcar WhatsApp',
  'OI': 'OI',
  'Delay OI': 'Delay OI',
  'PC': 'PC',
  'Delay PC': 'Delay PC',
  'N': 'N',
  'Apólice Emitida': 'Apólice Emitida',
  'Apólice Entregue': 'Apólice Entregue',
  'Não': 'Não',
};

export function EtapaAnalysisChart({ startDate, endDate, profissaoFilter }: Props) {
  const { user } = useAuth();
  const [selectedEtapa, setSelectedEtapa] = useState<string>("all");

  const { data: etapaData, isLoading } = useQuery({
    queryKey: ['metrics-by-etapa', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc('get_metrics_by_etapa', {
        p_user_id: user.id,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return (data || []) as EtapaMetrics[];
    },
    enabled: !!user?.id,
  });

  // Filter options for etapa
  const etapaOptions: FilterOption[] = useMemo(() => {
    if (!etapaData) return [];
    return etapaData
      .filter(e => e.total > 0 && e.etapa && e.etapa.trim() !== '')
      .map(e => ({
        value: e.etapa,
        label: ETAPA_DISPLAY_NAMES[e.etapa] || e.etapa,
        color: getEtapaHex(e.etapa)
      }));
  }, [etapaData]);

  // Filtered and processed data for chart
  const chartData = useMemo(() => {
    if (!etapaData) return [];
    
    let filtered = etapaData.filter(e => e.total > 0);
    
    if (selectedEtapa && selectedEtapa !== "all") {
      filtered = filtered.filter(e => e.etapa === selectedEtapa);
    }
    
    return filtered.map(item => ({
      name: ETAPA_DISPLAY_NAMES[item.etapa] || item.etapa,
      fullName: item.etapa,
      total: item.total,
      percentual: item.percentual,
      color: getEtapaHex(item.etapa)
    }));
  }, [etapaData, selectedEtapa]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!etapaData) return { total: 0, mainEtapas: [] };
    
    const total = etapaData.reduce((sum, e) => sum + Number(e.total), 0);
    const mainEtapas = etapaData
      .filter(e => e.total > 0)
      .slice(0, 6)
      .map(e => ({
        etapa: e.etapa,
        displayName: ETAPA_DISPLAY_NAMES[e.etapa] || e.etapa,
        total: e.total,
        percentual: e.percentual,
        color: getEtapaHex(e.etapa)
      }));
    
    return { total, mainEtapas };
  }, [etapaData]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4ff4a]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-inter font-normal tracking-tight text-white">
            Análise por Etapa do Funil
          </h3>
          <p className="text-xs text-white/60 mt-1">
            Distribuição de leads por etapa atual
          </p>
        </div>
        <FilterSelect
          label="Filtrar Etapa"
          options={etapaOptions}
          value={selectedEtapa}
          onChange={setSelectedEtapa}
          placeholder="Todas etapas"
          className="min-w-[180px]"
        />
      </div>

      {/* Chart + Legend Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical Bar Chart */}
        <div className="lg:col-span-2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.5)" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={(value: number) => [value, 'Leads']}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Summary */}
        <div className="space-y-4">
          <p className="text-sm text-white/70 font-medium">Resumo por Etapa</p>
          <div className="space-y-2">
            {summaryStats.mainEtapas.map((etapa, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: etapa.color }}
                  />
                  <span className="text-sm text-white truncate max-w-[100px]" title={etapa.displayName}>
                    {etapa.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{etapa.total}</span>
                  <span className="text-xs text-white/50 w-12 text-right">
                    {etapa.percentual}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Total de Leads</span>
              <span className="text-xl font-bold text-[#d4ff4a]">{summaryStats.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
