import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StagePerformanceChartProps {
  startDate?: Date;
  endDate?: Date;
}

const chartConfig = {
  leads: { label: "Leads", color: "hsl(142, 76%, 36%)" },
  conversions: { label: "Conversões", color: "hsl(45, 93%, 47%)" },
  pending: { label: "Pendentes", color: "hsl(217, 91%, 60%)" },
};

export function StagePerformanceChart({ startDate, endDate }: StagePerformanceChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user, startDate, endDate]);

  const fetchChartData = async () => {
    if (!user) return;

    try {
      const { data: leads, error } = await supabase
        .from("leads")
        .select("etapa, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate?.toISOString() || "2024-01-01")
        .lte("created_at", endDate?.toISOString() || new Date().toISOString());

      if (error) {
        console.error("Error fetching stage performance data:", error);
        return;
      }

      // Agrupar por etapa
      const stageGroups = leads.reduce((acc: any, lead) => {
        const stage = lead.etapa || "Sem Etapa";
        if (!acc[stage]) {
          acc[stage] = { total: 0, conversions: 0, pending: 0 };
        }
        acc[stage].total++;
        
        // Definir conversões e pendências baseado na etapa
        if (["Apólice Emitida", "Apólice Entregue"].includes(stage)) {
          acc[stage].conversions++;
        } else if (["Analisando Proposta", "Pendência de UW", "Delay PC"].includes(stage)) {
          acc[stage].pending++;
        }
        
        return acc;
      }, {});

      // Converter para formato do gráfico
      const data = Object.entries(stageGroups).map(([stage, stats]: [string, any]) => ({
        stage: stage,
        leads: stats.total,
        conversions: stats.conversions,
        pending: stats.pending,
      })).sort((a, b) => b.leads - a.leads).slice(0, 8); // Top 8 etapas

      setChartData(data);
    } catch (error) {
      console.error("Error in fetchChartData:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Etapa</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <BarChart data={chartData}>
            <XAxis 
              dataKey="stage" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="leads" stackId="a" fill="var(--color-leads)" name="Total Leads" />
            <Bar dataKey="conversions" stackId="a" fill="var(--color-conversions)" name="Conversões" />
            <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" name="Pendentes" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}