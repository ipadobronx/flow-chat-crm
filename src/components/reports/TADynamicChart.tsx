import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface ChartData {
  date: string;
  contatosEfetuados: number;
  ligacoesNaoAtendidas: number;
  marcarWhatsapp: number;
  ligarDepois: number;
  oi: number;
  outros?: number;
}

interface TADynamicChartProps {
  activeCard: string;
  data: {
    leadsContactados: ChartData[];
    naoAtendido: ChartData[];
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
  // Função para processar dados reais vindos do backend
  const processRealData = (rawData: ChartData[]): ChartData[] => {
    if (!rawData || rawData.length === 0) {
      return [];
    }
    
    // Retornar os dados reais, apenas formatando as datas se necessário
    return rawData.map(item => ({
      ...item,
      date: item.date // Manter o formato da data como está vindo do backend
    }));
  };

  const getChartInfo = () => {
    let rawData;
    let title;
    
    switch (activeCard) {
      case 'leadsContactados':
        title = `Leads Contactados - Últimos ${periodFilter} dias`;
        rawData = data.leadsContactados;
        break;
      case 'naoAtendido':
        title = `Não Atendido - Últimos ${periodFilter} dias`;
        rawData = data.naoAtendido;
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
      data: processRealData(rawData || []),
      comparisonData: [] // Para agora, não precisamos dos dados de comparação
    };
  };

  const chartInfo = getChartInfo();

  // Configuração do gráfico
  const chartConfig = {
    contatosEfetuados: { label: "Contatos Efetuados", color: "hsl(var(--chart-1))" },
    ligacoesNaoAtendidas: { label: "Ligações Não Atendidas", color: "hsl(var(--chart-4))" },
    marcarWhatsapp: { label: "Marcar WhatsApp", color: "hsl(var(--chart-3))" },
    ligarDepois: { label: "Ligar Depois", color: "hsl(var(--chart-4))" },
    oi: { label: "OI (Agendados)", color: "hsl(var(--chart-2))" },
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
              {activeCard === 'leadsContactados' ? (
                // Modo "Leads Contactados" - mostra categorias separadas
                <>
                  <Bar 
                    dataKey="ligacoesNaoAtendidas" 
                    stackId="a" 
                    fill="var(--color-ligacoesNaoAtendidas)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="ligarDepois" 
                    stackId="a" 
                    fill="var(--color-ligarDepois)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="marcarWhatsapp" 
                    stackId="a" 
                    fill="var(--color-marcarWhatsapp)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="oi" 
                    stackId="a" 
                    fill="var(--color-oi)" 
                    radius={[2, 2, 0, 0]}
                  />
                </>
              ) : activeCard === 'naoAtendido' ? (
                // Modo "Não Atendido" - mostra apenas ligações não atendidas
                <Bar 
                  dataKey="ligacoesNaoAtendidas" 
                  stackId="a" 
                  fill="var(--color-ligacoesNaoAtendidas)" 
                  radius={[2, 2, 0, 0]}
                />
              ) : (
                // Outros modos - mostra todas as barras
                <>
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
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="oi" 
                    stackId="a" 
                    fill="var(--color-oi)" 
                    radius={[2, 2, 0, 0]}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}