import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFunnelData();
    }
  }, [user, startDate, endDate]);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do funil de vendas
      const { data: salesData, error } = await supabase
        .from('leads')
        .select('etapa, created_at')
        .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString());

      if (error) throw error;

      // Contar leads por etapa do funil
      const totalRecs = salesData?.length || 0;
      const ligacoes = salesData?.filter(lead => 
        ['Ligar Depois', 'OI', 'PC', 'N', 'Apólice Emitida'].includes(lead.etapa)
      ).length || 0;
      const oisAgendados = salesData?.filter(lead => 
        ['OI', 'PC', 'N', 'Apólice Emitida'].includes(lead.etapa)
      ).length || 0;
      const propostasApresentadas = salesData?.filter(lead => 
        ['PC', 'N', 'Apólice Emitida'].includes(lead.etapa)
      ).length || 0;
      const negociosRealizados = salesData?.filter(lead => 
        ['N', 'Apólice Emitida'].includes(lead.etapa)
      ).length || 0;
      const apolicesEmitidas = salesData?.filter(lead => 
        lead.etapa === 'Apólice Emitida'
      ).length || 0;

      // Calcular percentuais de conversão
      const calcularPercentual = (atual: number, total: number) => {
        return total > 0 ? Math.round((atual / total) * 100) : 0;
      };

      const funnelStages: FunnelData[] = [
        {
          stage: "Nº de rec",
          count: totalRecs,
          percentage: 100,
          color: STAGE_COLORS["Nº de rec"]
        },
        {
          stage: "Ligações",
          count: ligacoes,
          percentage: calcularPercentual(ligacoes, totalRecs),
          color: STAGE_COLORS["Ligações"]
        },
        {
          stage: "OIs Agendados",
          count: oisAgendados,
          percentage: calcularPercentual(oisAgendados, totalRecs),
          color: STAGE_COLORS["OIs Agendados"]
        },
        {
          stage: "Proposta apresentada",
          count: propostasApresentadas,
          percentage: calcularPercentual(propostasApresentadas, totalRecs),
          color: STAGE_COLORS["Proposta apresentada"]
        },
        {
          stage: "N Realizado",
          count: negociosRealizados,
          percentage: calcularPercentual(negociosRealizados, totalRecs),
          color: STAGE_COLORS["N Realizado"]
        },
        {
          stage: "Apólice Emitida",
          count: apolicesEmitidas,
          percentage: calcularPercentual(apolicesEmitidas, totalRecs),
          color: STAGE_COLORS["Apólice Emitida"]
        }
      ];

      setFunnelData(funnelStages);
    } catch (error) {
      console.error('Erro ao buscar dados do funil de vendas:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas (Conversão)</CardTitle>
          <CardDescription>Acompanhe a conversão em cada etapa do processo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando dados...</p>
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