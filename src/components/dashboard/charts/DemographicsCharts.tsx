import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",  
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
  senary: "hsl(var(--primary))",
  septenary: "hsl(var(--secondary))",
  octonary: "hsl(var(--accent))"
};

interface DemographicsChartsProps {
  startDate?: Date;
  endDate?: Date;
  type: 'recs' | 'clientes';
}

export function DemographicsCharts({ startDate, endDate, type }: DemographicsChartsProps) {
  const { user } = useAuth();

  const { data: leads = [] } = useQuery({
    queryKey: ['demographics-leads', user?.id, startDate, endDate, type],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('leads')
        .select('profissao, casado, renda_estimada, tem_filhos, recomendante')
        .eq('user_id', user.id);

      // Filtrar por tipo (recs ou clientes)
      if (type === 'recs') {
        query = query.not('recomendante', 'is', null);
      } else {
        query = query.is('recomendante', null);
      }

      // Filtrar por data se fornecido
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDateTime.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Preparar dados para profissão
  const profissaoData = leads.reduce((acc: Record<string, number>, lead) => {
    const profissao = lead.profissao || 'Não informado';
    acc[profissao] = (acc[profissao] || 0) + 1;
    return acc;
  }, {});

  const profissaoChartData = Object.entries(profissaoData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Limitar a 8 categorias

  // Preparar dados para estado civil
  const estadoCivilData = leads.reduce((acc: Record<string, number>, lead) => {
    const estado = lead.casado ? 'Casado(a)' : 'Solteiro(a)';
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {});

  const estadoCivilChartData = Object.entries(estadoCivilData)
    .map(([name, value]) => ({ name, value }));

  // Preparar dados para renda
  const rendaData = leads.reduce((acc: Record<string, number>, lead) => {
    let faixa = 'Não informado';
    
    if (lead.renda_estimada) {
      const renda = parseFloat(lead.renda_estimada.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (renda <= 3000) {
        faixa = 'Até R$ 3.000';
      } else if (renda <= 5000) {
        faixa = 'R$ 3.001 - R$ 5.000';
      } else if (renda <= 10000) {
        faixa = 'R$ 5.001 - R$ 10.000';
      } else if (renda <= 20000) {
        faixa = 'R$ 10.001 - R$ 20.000';
      } else {
        faixa = 'Acima de R$ 20.000';
      }
    }
    
    acc[faixa] = (acc[faixa] || 0) + 1;
    return acc;
  }, {});

  const rendaChartData = Object.entries(rendaData)
    .map(([name, value]) => ({ name, value }));

  // Preparar dados para filhos
  const filhosData = leads.reduce((acc: Record<string, number>, lead) => {
    const temFilhos = lead.tem_filhos ? 'Com filhos' : 'Sem filhos';
    acc[temFilhos] = (acc[temFilhos] || 0) + 1;
    return acc;
  }, {});

  const filhosChartData = Object.entries(filhosData)
    .map(([name, value]) => ({ name, value }));

  const getColor = (index: number) => {
    const colorKeys = Object.keys(COLORS);
    return COLORS[colorKeys[index % colorKeys.length] as keyof typeof COLORS];
  };

  const renderCustomLabel = ({ percent }: any) => {
    return percent > 5 ? `${(percent).toFixed(0)}%` : '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Gráfico de Profissão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Profissão - {type === 'recs' ? 'Recomendações' : 'Clientes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={profissaoChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profissaoChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Estado Civil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Estado Civil - {type === 'recs' ? 'Recomendações' : 'Clientes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estadoCivilChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {estadoCivilChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Renda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Faixa de Renda - {type === 'recs' ? 'Recomendações' : 'Clientes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rendaChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rendaChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Filhos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Filhos - {type === 'recs' ? 'Recomendações' : 'Clientes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filhosChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {filhosChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}