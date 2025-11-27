import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

interface ChartData {
  date: string;
  contatosEfetuados: number;
  ligacoesNaoAtendidas: number;
  marcarWhatsapp: number;
  ligarDepois: number;
  oi: number;
  naoTemInteresse: number;
  outros?: number;
}

interface TADynamicChartProps {
  activeCard: string;
  data: {
    leadsContactados: ChartData[];
    naoAtendido: ChartData[];
    marcarWhatsapp: ChartData[];
    ligarDepois: ChartData[];
    naoTemInteresse: ChartData[];
    resultadoGeral: ChartData[];
  };
  currentPeriod: string;
  previousPeriod: string;
  periodFilter: number;
  isLoading?: boolean;
  onPeriodChange?: (period: number) => void;
}

// Custom Tooltip with liquid glass style
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-black/80 backdrop-blur-md px-4 py-3 text-xs shadow-xl">
        <p className="font-medium text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 py-0.5">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-white/70">{entry.name}:</span>
            <span className="text-white font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TADynamicChart({
  activeCard,
  data,
  currentPeriod,
  previousPeriod,
  periodFilter = 7,
  isLoading = false,
  onPeriodChange
}: TADynamicChartProps) {
  const processRealData = (rawData: ChartData[]): ChartData[] => {
    if (!rawData || rawData.length === 0) {
      return [];
    }
    return rawData.map(item => ({
      ...item,
      date: item.date
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
      case 'naoTemInteresse':
        title = `Não Tem Interesse - Últimos ${periodFilter} dias`;
        rawData = data.naoTemInteresse;
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
      comparisonData: []
    };
  };

  const chartInfo = getChartInfo();

  const getTickInterval = () => {
    if (periodFilter <= 7) return 0;
    if (periodFilter <= 30) return 2;
    return 6;
  };

  const chartConfig = {
    contatosEfetuados: { label: "Contatos Efetuados", color: "hsl(217 91% 60%)" },
    ligacoesNaoAtendidas: { label: "Ligações Não Atendidas", color: "hsl(220 9% 46%)" },
    ligarDepois: { label: "Ligar Depois", color: "hsl(0 84% 60%)" },
    marcarWhatsapp: { label: "Marcar WhatsApp", color: "hsl(25 95% 53%)" },
    naoTemInteresse: { label: "Não Tem Interesse", color: "hsl(280 87% 60%)" },
    oi: { label: "OI (Agendados)", color: "hsl(142 71% 45%)" },
    outros: { label: "Outros", color: "hsl(var(--chart-4))" }
  };

  // Loading state with liquid glass
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md shadow-xl w-full">
        <div className="h-80 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
            <p className="text-sm text-white/60">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md shadow-xl w-full transition-all duration-300 hover:shadow-2xl hover:shadow-white/5">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg text-white font-inter font-normal tracking-tight">
            {chartInfo.title}
          </h3>
          <div className="text-xs text-white/50">
            <span className="font-medium text-white/70">{currentPeriod}</span>
            <span className="mx-1">vs</span>
            <span className="font-medium text-white/70">{previousPeriod}</span>
          </div>
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="p-6 pt-2">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartInfo.data}
              margin={{ top: 10, right: 20, left: 0, bottom: 70 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.08)" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={getTickInterval()}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              {activeCard === 'leadsContactados' ? (
                <>
                  <Bar 
                    dataKey="ligacoesNaoAtendidas" 
                    name="Não Atendidas"
                    stackId="a" 
                    fill="var(--color-ligacoesNaoAtendidas)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="ligarDepois" 
                    name="Ligar Depois"
                    stackId="a" 
                    fill="var(--color-ligarDepois)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="marcarWhatsapp" 
                    name="Marcar WhatsApp"
                    stackId="a" 
                    fill="var(--color-marcarWhatsapp)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="naoTemInteresse" 
                    name="Sem Interesse"
                    stackId="a" 
                    fill="var(--color-naoTemInteresse)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="oi" 
                    name="OI Agendados"
                    stackId="a" 
                    fill="var(--color-oi)" 
                    radius={[6, 6, 0, 0]}
                  />
                </>
              ) : activeCard === 'naoAtendido' ? (
                <Bar 
                  dataKey="ligacoesNaoAtendidas" 
                  name="Não Atendidas"
                  stackId="a" 
                  fill="var(--color-ligacoesNaoAtendidas)" 
                  radius={[8, 8, 4, 4]}
                />
              ) : activeCard === 'ligarDepois' ? (
                <Bar 
                  dataKey="ligarDepois" 
                  name="Ligar Depois"
                  stackId="a" 
                  fill="var(--color-ligarDepois)" 
                  radius={[8, 8, 4, 4]}
                />
              ) : activeCard === 'marcarWhatsapp' ? (
                <Bar 
                  dataKey="marcarWhatsapp" 
                  name="Marcar WhatsApp"
                  stackId="a" 
                  fill="var(--color-marcarWhatsapp)" 
                  radius={[8, 8, 4, 4]}
                />
              ) : activeCard === 'resultadoGeral' ? (
                <Bar 
                  dataKey="oi" 
                  name="OI Agendados"
                  stackId="a" 
                  fill="var(--color-oi)" 
                  radius={[8, 8, 4, 4]}
                />
              ) : activeCard === 'naoTemInteresse' ? (
                <Bar 
                  dataKey="naoTemInteresse" 
                  name="Sem Interesse"
                  stackId="a" 
                  fill="var(--color-naoTemInteresse)" 
                  radius={[8, 8, 4, 4]}
                />
              ) : (
                <>
                  <Bar 
                    dataKey="ligacoesNaoAtendidas" 
                    name="Não Atendidas"
                    stackId="a" 
                    fill="var(--color-ligacoesNaoAtendidas)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="ligarDepois" 
                    name="Ligar Depois"
                    stackId="a" 
                    fill="var(--color-ligarDepois)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="marcarWhatsapp" 
                    name="Marcar WhatsApp"
                    stackId="a" 
                    fill="var(--color-marcarWhatsapp)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="naoTemInteresse" 
                    name="Sem Interesse"
                    stackId="a" 
                    fill="var(--color-naoTemInteresse)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="oi" 
                    name="OI Agendados"
                    stackId="a" 
                    fill="var(--color-oi)" 
                    radius={[6, 6, 0, 0]}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
