import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface ChartData {
  date: string;
  contatosEfetuados: number;
  ligacoesNaoAtendidas: number;
  marcarWhatsapp: number;
  ligarDepois: number;
  outros?: number;
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
  periodFilter: number; // Número de dias (7, 30, 90, etc.)
  isLoading?: boolean;
  onPeriodChange?: (period: number) => void;
}

export default function TADynamicChart({
  activeCard,
  data,
  currentPeriod,
  previousPeriod,
  periodFilter = 7,
  isLoading = false,
  onPeriodChange
}: TADynamicChartProps) {
  // Função para gerar dados dinâmicos baseados no período
  const generateDynamicData = (rawData: any[], period: number) => {
    const dateData: ChartData[] = [];
    const today = new Date();
    
    // Gerar dados para o período selecionado
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Simular dados baseados na data - em produção, isso viria da API filtrada
      const dayData: ChartData = {
        date: formattedDate,
        contatosEfetuados: Math.floor(Math.random() * 5) + 1,
        ligacoesNaoAtendidas: Math.floor(Math.random() * 3),
        marcarWhatsapp: Math.floor(Math.random() * 2),
        ligarDepois: Math.floor(Math.random() * 2)
      };
      
      dateData.push(dayData);
    }
    
    return dateData;
  };

  // Função para gerar dados de comparação do período anterior
  const generateComparisonData = (period: number) => {
    const comparisonData: ChartData[] = [];
    const today = new Date();
    
    // Gerar dados para o período anterior (mesmo número de dias, mas anteriores)
    for (let i = (period * 2) - 1; i >= period; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const dayData: ChartData = {
        date: formattedDate,
        contatosEfetuados: Math.floor(Math.random() * 4) + 1,
        ligacoesNaoAtendidas: Math.floor(Math.random() * 2),
        marcarWhatsapp: Math.floor(Math.random() * 2),
        ligarDepois: Math.floor(Math.random() * 3)
      };
      
      comparisonData.push(dayData);
    }
    
    return comparisonData;
  };

  const getChartInfo = () => {
    let rawData;
    let title;
    
    switch (activeCard) {
      case 'leadsContactados':
        title = `Leads Contactados - Últimos ${periodFilter} dias`;
        rawData = data.leadsContactados;
        break;
      case 'marcarWhatsapp':
        title = `Marcar WhatsApp - Últimos ${periodFilter} dias`;
        rawData = data.marcarWhatsapp;
        break;
      case 'ligarDepois':
        title = `Ligar Depois - Últimos ${periodFilter} dias`;
        rawData = data.ligarDepois;
        break;
      case 'resultadoGeral':
        title = `Resultado Geral - Últimos ${periodFilter} dias`;
        rawData = data.resultadoGeral;
        break;
      default:
        title = `Leads Contactados - Últimos ${periodFilter} dias`;
        rawData = data.leadsContactados;
    }
    
    return {
      title,
      data: generateDynamicData(rawData, periodFilter),
      comparisonData: generateComparisonData(periodFilter)
    };
  };

  const chartInfo = getChartInfo();

  // Configuração do gráfico
  const chartConfig = {
    contatosEfetuados: { label: "Contatos Efetuados", color: "hsl(var(--chart-1))" },
    ligacoesNaoAtendidas: { label: "Ligações Não Atendidas", color: "hsl(var(--chart-2))" },
    marcarWhatsapp: { label: "Marcar WhatsApp", color: "hsl(var(--chart-3))" },
    ligarDepois: { label: "Ligar Depois", color: "hsl(var(--chart-4))" },
    outros: { label: "Outros", color: "hsl(var(--chart-5))" }
  };

  // Estado de loading
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="h-80 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            {chartInfo.title}
          </CardTitle>
          <div className="text-xs text-gray-500">
            <span className="font-medium">{currentPeriod}</span> vs <span className="font-medium">{previousPeriod}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartInfo.data}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="contatosEfetuados" 
                stackId="a" 
                fill="var(--color-contatosEfetuados)" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="ligacoesNaoAtendidas" 
                stackId="a" 
                fill="var(--color-ligacoesNaoAtendidas)" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="marcarWhatsapp" 
                stackId="a" 
                fill="var(--color-marcarWhatsapp)" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="ligarDepois" 
                stackId="a" 
                fill="var(--color-ligarDepois)" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}