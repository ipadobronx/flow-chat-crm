import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Phone, Target, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SitPlanCharts() {
  const { data: leadsData = [] } = useQuery({
    queryKey: ["sitplan-charts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Generate mock data for Friday comparisons (last 6 weeks)
  const generateFridayData = () => {
    const fridays = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const friday = new Date(today);
      friday.setDate(today.getDate() - (i * 7));
      
      // Mock data based on leads
      const totalLeads = Math.floor(Math.random() * 20) + 10;
      const contactedLeads = Math.floor(totalLeads * (0.6 + Math.random() * 0.3));
      const conversions = Math.floor(contactedLeads * (0.2 + Math.random() * 0.3));
      
      fridays.push({
        date: friday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        ligacoes: contactedLeads,
        conversoes: conversions,
        taxa: Math.round((conversions / contactedLeads) * 100),
      });
    }
    
    return fridays;
  };

  const fridayData = generateFridayData();

  // Calculate current stats
  const totalLeads = leadsData.length;
  const completedLeads = leadsData.filter(lead => lead.status === "Concluído").length;
  const contactRate = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;
  const avgConversions = fridayData.reduce((acc, day) => acc + day.conversoes, 0) / fridayData.length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Comparativo de Performance - Sextas Anteriores
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Ligações Hoje</p>
                <p className="text-2xl font-bold">{completedLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Contato</p>
                <p className="text-2xl font-bold">{contactRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-chart-1" />
              <div>
                <p className="text-sm text-muted-foreground">Média Conversões</p>
                <p className="text-2xl font-bold">{Math.round(avgConversions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ligações por Sexta-feira</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fridayData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground"
                />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="ligacoes" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fridayData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground"
                />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="taxa" 
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}