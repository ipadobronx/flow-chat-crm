import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesFunnel } from "@/hooks/dashboard/useSalesFunnel";

interface SalesFunnelChartProps {
  startDate?: Date;
  endDate?: Date;
}

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

const STAGE_COLORS = {
  "Nº de rec": "#3b82f6",
  "Ligações": "#10b981",
  "OIs Agendados": "#f59e0b",
  "Proposta apresentada": "#8b5cf6",
  "N Realizado": "#06b6d4",
  "Apólice Emitida": "#ef4444"
};

export function SalesFunnelChart({ startDate, endDate }: SalesFunnelChartProps) {
  const { data: metrics, isLoading } = useSalesFunnel(startDate, endDate);

  const funnelData: FunnelData[] = [
    {
      stage: "Nº de rec",
      count: metrics?.total_rec || 0,
      percentage: 100,
      color: STAGE_COLORS["Nº de rec"]
    },
    {
      stage: "Ligações",
      count: metrics?.total_ligacoes || 0,
      percentage: Math.round(metrics?.taxa_conversao_ligacao || 0),
      color: STAGE_COLORS["Ligações"]
    },
    {
      stage: "OIs Agendados",
      count: metrics?.total_oi_agendados || 0,
      percentage: Math.round(metrics?.taxa_conversao_oi || 0),
      color: STAGE_COLORS["OIs Agendados"]
    },
    {
      stage: "Proposta apresentada",
      count: metrics?.total_proposta_apresentada || 0,
      percentage: Math.round(metrics?.taxa_conversao_proposta || 0),
      color: STAGE_COLORS["Proposta apresentada"]
    },
    {
      stage: "N Realizado",
      count: metrics?.total_n_realizado || 0,
      percentage: Math.round(metrics?.taxa_conversao_n || 0),
      color: STAGE_COLORS["N Realizado"]
    },
    {
      stage: "Apólice Emitida",
      count: metrics?.total_apolice_emitida || 0,
      percentage: Math.round(metrics?.taxa_conversao_apolice || 0),
      color: STAGE_COLORS["Apólice Emitida"]
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} leads ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas (Conversão)</CardTitle>
          <CardDescription>Acompanhe a conversão em cada etapa do processo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] space-y-4">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="w-4 h-4 rounded mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Vendas (Conversão)</CardTitle>
        <CardDescription>
          Acompanhe a conversão em cada etapa do processo de vendas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnelData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="stage" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estatísticas de conversão */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {funnelData.map((stage, index) => (
            <div key={stage.stage} className="text-center">
              <div 
                className="w-4 h-4 rounded mx-auto mb-1" 
                style={{ backgroundColor: stage.color }}
              />
              <p className="text-xs font-medium">{stage.stage}</p>
              <p className="text-xs text-muted-foreground">
                {stage.count} ({stage.percentage}%)
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}