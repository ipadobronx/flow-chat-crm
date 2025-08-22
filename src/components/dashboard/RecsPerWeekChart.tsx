import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp } from "lucide-react";

interface RecsPerWeekChartProps {
  startDate?: Date;
  endDate?: Date;
}

interface WeeklyData {
  week: string;
  recs: number;
  weekStart: Date;
}

export function RecsPerWeekChart({ startDate, endDate }: RecsPerWeekChartProps) {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    if (user) {
      fetchWeeklyData();
    }
  }, [user, startDate, endDate]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      
      // Definir período padrão se não fornecido (últimas 8 semanas)
      const defaultEndDate = endDate || new Date();
      const defaultStartDate = startDate || new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
      
      // Buscar todos os leads no período
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', defaultStartDate.toISOString())
        .lte('created_at', defaultEndDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Gerar todas as semanas no intervalo
      const weeks = eachWeekOfInterval(
        {
          start: defaultStartDate,
          end: defaultEndDate
        },
        { weekStartsOn: 1 } // Segunda-feira como início da semana
      );

      // Contar leads por semana
      const weeklyStats = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        const recsInWeek = leadsData?.filter(lead => {
          const leadDate = parseISO(lead.created_at);
          return leadDate >= weekStart && leadDate <= weekEnd;
        }).length || 0;

        return {
          week: format(weekStart, "dd/MM", { locale: ptBR }),
          recs: recsInWeek,
          weekStart
        };
      });

      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('Erro ao buscar dados semanais:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">Semana de {label}</p>
          <p className="text-sm text-muted-foreground">
            {data.recs} recomendações
          </p>
        </div>
      );
    }
    return null;
  };

  const totalRecs = weeklyData.reduce((sum, week) => sum + week.recs, 0);
  const averageRecs = weeklyData.length > 0 ? Math.round(totalRecs / weeklyData.length) : 0;
  const maxRecs = Math.max(...weeklyData.map(w => w.recs), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recs por Semana</CardTitle>
          <CardDescription>Evolução das recomendações ao longo do tempo</CardDescription>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recs por Semana</CardTitle>
            <CardDescription>
              Evolução das recomendações ao longo do tempo
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={weeklyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="week" 
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="recs" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={weeklyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="week" 
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="recs" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Estatísticas resumidas */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{totalRecs}</p>
            <p className="text-xs text-muted-foreground">Total no período</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{averageRecs}</p>
            <p className="text-xs text-muted-foreground">Média por semana</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{maxRecs}</p>
            <p className="text-xs text-muted-foreground">Melhor semana</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}