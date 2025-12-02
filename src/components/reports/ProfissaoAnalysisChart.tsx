import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { FilterSelect, FilterOption } from "./FilterSelect";
import { getEtapaHex } from "@/lib/stageColors";
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

interface ProfissaoMetrics {
  profissao: string;
  total: number;
  nao_atendido: number;
  ligar_depois: number;
  marcar_whatsapp: number;
  oi: number;
  pc: number;
  apolice_emitida: number;
}

interface Props {
  startDate: Date;
  endDate: Date;
  etapaFilter?: string;
}

const COLORS = [
  '#6366f1', '#f97316', '#22c55e', '#ec4899', '#eab308', 
  '#14b8a6', '#8b5cf6', '#ef4444', '#3b82f6', '#84cc16'
];

export function ProfissaoAnalysisChart({ startDate, endDate, etapaFilter }: Props) {
  const { user } = useAuth();
  const [selectedProfissao, setSelectedProfissao] = useState<string>("all");

  const { data: profissaoData, isLoading } = useQuery({
    queryKey: ['metrics-by-profissao', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc('get_metrics_by_profissao', {
        p_user_id: user.id,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return (data || []) as ProfissaoMetrics[];
    },
    enabled: !!user?.id,
  });

  // Filter options for profissao
  const profissaoOptions: FilterOption[] = useMemo(() => {
    if (!profissaoData) return [];
    return profissaoData
      .filter(p => p.total > 0)
      .slice(0, 15)
      .map((p, idx) => ({
        value: p.profissao,
        label: p.profissao,
        color: COLORS[idx % COLORS.length]
      }));
  }, [profissaoData]);

  // Filtered and processed data for chart
  const chartData = useMemo(() => {
    if (!profissaoData) return [];
    
    let filtered = profissaoData.filter(p => p.total > 0);
    
    if (selectedProfissao && selectedProfissao !== "all") {
      filtered = filtered.filter(p => p.profissao === selectedProfissao);
    }
    
    return filtered.slice(0, 10).map((item, idx) => ({
      name: item.profissao.length > 15 ? item.profissao.substring(0, 15) + '...' : item.profissao,
      fullName: item.profissao,
      total: item.total,
      oi: item.oi,
      pc: item.pc,
      apolice: item.apolice_emitida,
      convOI: item.total > 0 ? ((item.oi / item.total) * 100).toFixed(1) : '0',
      color: COLORS[idx % COLORS.length]
    }));
  }, [profissaoData, selectedProfissao]);

  // Top professions table data
  const tableData = useMemo(() => {
    if (!profissaoData) return [];
    return profissaoData
      .filter(p => p.total > 0)
      .slice(0, 8)
      .map((p, idx) => ({
        ...p,
        color: COLORS[idx % COLORS.length],
        convOI: p.total > 0 ? ((p.oi / p.total) * 100).toFixed(1) : '0',
        convPC: p.oi > 0 ? ((p.pc / p.oi) * 100).toFixed(1) : '0',
      }));
  }, [profissaoData]);

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
            Análise por Profissão
          </h3>
          <p className="text-xs text-white/60 mt-1">
            Métricas de conversão segmentadas por profissão
          </p>
        </div>
        <FilterSelect
          label="Filtrar Profissão"
          options={profissaoOptions}
          value={selectedProfissao}
          onChange={setSelectedProfissao}
          placeholder="Todas profissões"
          className="min-w-[180px]"
        />
      </div>

      {/* Chart + Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart - OIs por Profissão */}
        <div className="space-y-3">
          <p className="text-sm text-white/70 font-medium">OIs por Profissão</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      oi: 'OIs',
                      total: 'Total',
                      pc: 'PCs',
                      apolice: 'Apólices'
                    };
                    return [value, labels[name] || name];
                  }}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Bar dataKey="oi" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Table */}
        <div className="space-y-3">
          <p className="text-sm text-white/70 font-medium">Resumo de Conversão</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/60 font-medium">Profissão</th>
                  <th className="text-right py-2 text-white/60 font-medium">Total</th>
                  <th className="text-right py-2 text-white/60 font-medium">OI</th>
                  <th className="text-right py-2 text-white/60 font-medium">Conv%</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="text-white truncate max-w-[120px]" title={row.profissao}>
                          {row.profissao}
                        </span>
                      </div>
                    </td>
                    <td className="text-right text-white/70 py-2.5">{row.total}</td>
                    <td className="text-right text-white py-2.5 font-medium">{row.oi}</td>
                    <td className="text-right py-2.5">
                      <span className={cn(
                        "text-sm font-medium",
                        parseFloat(row.convOI) >= 10 ? "text-[#d4ff4a]" : 
                        parseFloat(row.convOI) >= 5 ? "text-orange-400" : "text-white/60"
                      )}>
                        {row.convOI}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
