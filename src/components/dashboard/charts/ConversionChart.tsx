import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ConversionChartProps {
  startDate?: Date;
  endDate?: Date;
}

const chartConfig = {
  count: {
    label: "Quantidade",
    color: "hsl(var(--chart-1))",
  },
};

export function ConversionChart({ startDate, endDate }: ConversionChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchConversionData();
  }, [startDate, endDate]);

  const fetchConversionData = async () => {
    try {
      let query = supabase
        .from('leads')
        .select('*');
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: leads, error } = await query;
      
      if (error) throw error;
      if (!leads) return;

      // Calcular dados do funil
      const ligacoesEfetuadas = leads.length;
      const foramAtendidas = leads.filter(lead => 
        lead.etapa !== 'Novo' && lead.etapa !== 'Ligar Depois'
      ).length;
      const oiMarcados = leads.filter(lead => 
        lead.etapa === 'OI' || lead.etapa === 'Delay OI'
      ).length;
      const virouPC = leads.filter(lead => 
        lead.etapa === 'PC' || lead.etapa === 'Delay PC'
      ).length;
      const virouN = leads.filter(lead => 
        lead.etapa === 'N' || lead.etapa === 'Não'
      ).length;

      const data = [
        { stage: "Ligações", count: ligacoesEfetuadas },
        { stage: "Atendidas", count: foramAtendidas },
        { stage: "OI", count: oiMarcados },
        { stage: "PC", count: virouPC },
        { stage: "N", count: virouN }
      ];

      setChartData(data);
    } catch (error) {
      console.error('Erro ao buscar dados de conversão:', error);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Funil de Conversão</CardTitle>
        <CardDescription>
          Distribuição das etapas do processo de vendas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="stage" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}