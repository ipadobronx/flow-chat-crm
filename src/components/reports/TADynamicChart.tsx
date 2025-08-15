import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ChartData {
  name: string;
  atual: number;
  anterior: number;
}

interface TADynamicChartProps {
  activeCard: string;
  data: {
    leadsContactados: ChartData[];
    marcarWhatsapp: ChartData[];
    ligarDepois: ChartData[];
    resultadoGeral: ChartData[];
  };
  currentPeriod: string;
  previousPeriod: string;
}

export function TADynamicChart({
  activeCard,
  data,
  currentPeriod,
  previousPeriod
}: TADynamicChartProps) {
  const getChartData = () => {
    switch (activeCard) {
      case 'leads-contactados':
        return {
          title: 'Leads Contactados - Detalhamento',
          data: data.leadsContactados
        };
      case 'marcar-whatsapp':
        return {
          title: 'Marcar no WhatsApp - Resultados',
          data: data.marcarWhatsapp
        };
      case 'ligar-depois':
        return {
          title: 'Ligar Depois - Resultados',
          data: data.ligarDepois
        };
      case 'resultado-geral':
        return {
          title: 'Resultado Geral do TA',
          data: data.resultadoGeral
        };
      default:
        return {
          title: 'Leads Contactados - Detalhamento',
          data: data.leadsContactados
        };
    }
  };

  const chartInfo = getChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-card-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'atual' ? currentPeriod : previousPeriod}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{chartInfo.title}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Comparação: {currentPeriod} vs {previousPeriod}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartInfo.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="atual" 
                name={currentPeriod}
                fill="hsl(var(--chart-1))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="anterior" 
                name={previousPeriod}
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}