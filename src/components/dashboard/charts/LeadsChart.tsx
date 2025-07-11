import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadsChartProps {
  startDate?: Date;
  endDate?: Date;
}

const chartConfig = {
  ligacoes: {
    label: "Ligações Efetuadas",
    color: "hsl(var(--chart-1))",
  },
  atendidas: {
    label: "Foram Atendidas", 
    color: "hsl(var(--chart-2))",
  },
  oi: {
    label: "OI Marcados",
    color: "hsl(var(--warning))",
  },
};

export function LeadsChart({ startDate, endDate }: LeadsChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchChartData();
  }, [startDate, endDate]);

  const fetchChartData = async () => {
    try {
      // Define período padrão se não houver filtros
      const end = endDate || new Date();
      const start = startDate || subDays(end, 7);

      // Buscar leads do período
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      // Gerar dados por dia
      const days = eachDayOfInterval({ start, end });
      const data = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayLeads = leads?.filter(lead => 
          format(new Date(lead.created_at!), 'yyyy-MM-dd') === dayStr
        ) || [];

        const ligacoes = dayLeads.length;
        const atendidas = dayLeads.filter(lead => 
          lead.etapa !== 'Novo' && lead.etapa !== 'Ligar Depois' && lead.etapa !== 'Tentativa'
        ).length;
        const oi = dayLeads.filter(lead => 
          lead.etapa === 'OI' || lead.etapa === 'Delay OI'
        ).length;

        return {
          day: format(day, 'dd/MM', { locale: ptBR }),
          ligacoes,
          atendidas,
          oi
        };
      });

      setChartData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Atividade Diária</CardTitle>
        <CardDescription>
          Ligações efetuadas, atendidas e OI marcados por dia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="ligacoes" 
                stroke="var(--color-ligacoes)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-ligacoes)" }}
                activeDot={{ r: 6, fill: "var(--color-ligacoes)" }}
              />
              <Line 
                type="monotone" 
                dataKey="atendidas" 
                stroke="var(--color-atendidas)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-atendidas)" }}
                activeDot={{ r: 6, fill: "var(--color-atendidas)" }}
              />
              <Line 
                type="monotone" 
                dataKey="oi" 
                stroke="var(--color-oi)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-oi)" }}
                activeDot={{ r: 6, fill: "var(--color-oi)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}