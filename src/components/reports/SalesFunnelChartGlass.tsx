import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesFunnel } from "@/hooks/dashboard/useSalesFunnel";

interface SalesFunnelChartGlassProps {
  startDate?: Date;
  endDate?: Date;
}

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

const STAGE_COLORS: Record<string, string> = {
  "Nº de rec": "#3b82f6",      // blue
  "Ligações": "#22c55e",       // green
  "OIs Agendados": "#f59e0b",  // amber
  "Proposta": "#a855f7",       // purple
  "N Realizado": "#06b6d4",    // cyan
  "Apólice": "#eab308",        // yellow
};

export function SalesFunnelChartGlass({ startDate, endDate }: SalesFunnelChartGlassProps) {
  const { data: metrics, isLoading } = useSalesFunnel(startDate, endDate);

  const funnelData: FunnelData[] = useMemo(() => {
    if (!metrics) return [];

    const totalRec = metrics.total_rec || 1;

    return [
      { 
        stage: "Nº de rec", 
        count: metrics.total_rec || 0, 
        percentage: 100,
        color: STAGE_COLORS["Nº de rec"]
      },
      { 
        stage: "Ligações", 
        count: metrics.total_ligacoes || 0, 
        percentage: metrics.taxa_conversao_ligacao || 0,
        color: STAGE_COLORS["Ligações"]
      },
      { 
        stage: "OIs Agendados", 
        count: metrics.total_oi_agendados || 0, 
        percentage: metrics.taxa_conversao_oi || 0,
        color: STAGE_COLORS["OIs Agendados"]
      },
      { 
        stage: "Proposta", 
        count: metrics.total_proposta_apresentada || 0, 
        percentage: metrics.taxa_conversao_proposta || 0,
        color: STAGE_COLORS["Proposta"]
      },
      { 
        stage: "N Realizado", 
        count: metrics.total_n_realizado || 0, 
        percentage: metrics.taxa_conversao_n || 0,
        color: STAGE_COLORS["N Realizado"]
      },
      { 
        stage: "Apólice", 
        count: metrics.total_apolice_emitida || 0, 
        percentage: metrics.taxa_conversao_apolice || 0,
        color: STAGE_COLORS["Apólice"]
      },
    ];
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6">
        <Skeleton className="h-6 w-48 mb-2 bg-white/10" />
        <Skeleton className="h-4 w-64 mb-6 bg-white/10" />
        <Skeleton className="h-[300px] w-full bg-white/10" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as FunnelData;
      return (
        <div className="rounded-xl border border-white/20 bg-black/90 backdrop-blur-xl p-3 shadow-xl">
          <p className="font-medium text-white">{data.stage}</p>
          <p className="text-sm text-white/70">
            <span className="text-white font-medium">{data.count}</span> leads
          </p>
          <p className="text-sm text-white/70">
            <span className="text-[#d4ff4a] font-medium">{data.percentage.toFixed(1)}%</span> conversão
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-inter font-normal tracking-tight text-white">
          Funil de Vendas
        </h3>
        <p className="text-sm text-white/50">
          Acompanhe a conversão em cada etapa do processo
        </p>
      </div>
      
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis 
              dataKey="stage" 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.15)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" radius={[8, 8, 4, 4]} maxBarSize={50}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda em grid */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {funnelData.map(stage => (
          <div key={stage.stage} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{stage.stage}</p>
              <p className="text-xs text-white/50">{stage.count} ({stage.percentage.toFixed(0)}%)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
