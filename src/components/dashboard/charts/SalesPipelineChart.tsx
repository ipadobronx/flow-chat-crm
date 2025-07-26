import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SalesPipelineChartProps {
  startDate?: Date;
  endDate?: Date;
}

const chartConfig = {
  performance: { label: "Performance", color: "hsl(20, 100%, 60%)" },
};

export function SalesPipelineChart({ startDate, endDate }: SalesPipelineChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [stalledDeals, setStalledDeals] = useState(0);
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
        .select("etapa, etapa_changed_at, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate?.toISOString() || "2024-01-01")
        .lte("created_at", endDate?.toISOString() || new Date().toISOString());

      if (error) {
        console.error("Error fetching pipeline data:", error);
        return;
      }

      // Definir a ordem das etapas do pipeline
      const pipelineStages = [
        "Novo",
        "OI", 
        "PC",
        "Analisando Proposta",
        "Pendência de UW",
        "Apólice Emitida",
        "Apólice Entregue"
      ];

      // Calcular performance por etapa (taxa de conversão)
      const stageData = pipelineStages.map((stage, index) => {
        const leadsInStage = leads.filter(lead => lead.etapa === stage).length;
        const totalLeads = leads.length;
        const conversionRate = totalLeads > 0 ? (leadsInStage / totalLeads) * 100 : 0;
        
        return {
          stage: `${index + 1}`,
          stageName: stage,
          value: Math.round(conversionRate),
          leadsCount: leadsInStage
        };
      });

      // Calcular deals emperrados (mais de 7 dias na mesma etapa)
      const now = new Date();
      const stalledCount = leads.filter(lead => {
        if (!lead.etapa_changed_at) return false;
        const daysSinceChange = (now.getTime() - new Date(lead.etapa_changed_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceChange > 7 && !["Apólice Emitida", "Apólice Entregue", "N", "Não"].includes(lead.etapa);
      }).length;

      setChartData(stageData);
      setStalledDeals(stalledCount);
    } catch (error) {
      console.error("Error in fetchChartData:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">
            {stalledDeals} Negócios Emperrados no Pipeline
          </h3>
          <p className="text-muted-foreground">
            Leads parados há mais de 7 dias na mesma etapa
          </p>
          
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <AreaChart data={chartData}>
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Etapas do Pipeline', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                hide 
                domain={[0, 'dataMax + 10']}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name, props) => [
                  `${value}% (${props.payload.leadsCount} leads)`,
                  props.payload.stageName
                ]}
                labelFormatter={(label) => `Etapa ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-performance)" 
                fill="url(#gradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-performance)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="var(--color-performance)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}