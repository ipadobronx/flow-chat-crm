import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DailyActivityChartProps {
  startDate?: Date;
  endDate?: Date;
}

const chartConfig = {
  calls: { label: "Ligações", color: "hsl(217, 91%, 60%)" },
  leads: { label: "Novos Leads", color: "hsl(142, 76%, 36%)" },
};

export function DailyActivityChart({ startDate, endDate }: DailyActivityChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user, startDate, endDate]);

  const fetchChartData = async () => {
    if (!user) return;

    try {
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
      const end = endDate || new Date();

      // Buscar ligações
      const { data: calls, error: callsError } = await supabase
        .from("ligacoes_historico")
        .select("data_ligacao")
        .eq("user_id", user.id)
        .gte("data_ligacao", start.toISOString())
        .lte("data_ligacao", end.toISOString());

      if (callsError) {
        console.error("Error fetching calls data:", callsError);
        return;
      }

      // Buscar novos leads
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (leadsError) {
        console.error("Error fetching leads data:", leadsError);
        return;
      }

      // Agrupar por dia
      const dailyData: { [key: string]: { calls: number; leads: number } } = {};

      // Inicializar todos os dias com 0
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyData[dateKey] = { calls: 0, leads: 0 };
      }

      // Contar ligações por dia
      calls.forEach(call => {
        const dateKey = call.data_ligacao.split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].calls++;
        }
      });

      // Contar leads por dia
      leads.forEach(lead => {
        const dateKey = lead.created_at.split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].leads++;
        }
      });

      // Converter para formato do gráfico
      const data = Object.entries(dailyData).map(([date, stats]) => ({
        day: new Date(date).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        calls: stats.calls,
        leads: stats.leads,
      }));

      setChartData(data);
      setTotalCalls(calls.length);
    } catch (error) {
      console.error("Error in fetchChartData:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Diária</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-6xl font-bold text-primary">{totalCalls}</div>
          <p className="text-muted-foreground">Total de ligações no período</p>
          
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <LineChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="var(--color-calls)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-calls)", strokeWidth: 2, r: 4 }}
                name="Ligações"
              />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="var(--color-leads)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-leads)", strokeWidth: 2, r: 3 }}
                name="Novos Leads"
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}