import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tables } from "@/integrations/supabase/types";

type TARelatorio = Tables<"ta_relatorios">;

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

export function TAReports() {
  const { user } = useAuth();

  const { data: relatorios = [], isLoading } = useQuery({
    queryKey: ["ta-relatorios", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("ta_relatorios")
        .select("*")
        .eq("user_id", user.id)
        .order("data_relatorio", { ascending: false });
      
      if (error) throw error;
      return data as TARelatorio[];
    },
    enabled: !!user?.id,
  });

  const dadosGraficoBarras = relatorios.slice(0, 10).map(rel => ({
    data: format(new Date(rel.data_relatorio), "dd/MM", { locale: ptBR }),
    "Total Leads": rel.total_leads,
    "Ligações": rel.total_ligacoes,
    "Atendidas": rel.ligacoes_atendidas,
    "Agendadas": rel.ligacoes_agendadas,
  })).reverse();

  // Calcular totais gerais
  const totaisGerais = relatorios.reduce((acc, rel) => ({
    totalLeads: acc.totalLeads + rel.total_leads,
    totalLigacoes: acc.totalLigacoes + rel.total_ligacoes,
    ligacoesAtendidas: acc.ligacoesAtendidas + rel.ligacoes_atendidas,
    ligacoesNaoAtendidas: acc.ligacoesNaoAtendidas + rel.ligacoes_nao_atendidas,
    ligacoesLigarDepois: acc.ligacoesLigarDepois + rel.ligacoes_ligar_depois,
    ligacoesAgendadas: acc.ligacoesAgendadas + rel.ligacoes_agendadas,
    ligacoesMarcadas: acc.ligacoesMarcadas + rel.ligacoes_marcadas,
  }), {
    totalLeads: 0,
    totalLigacoes: 0,
    ligacoesAtendidas: 0,
    ligacoesNaoAtendidas: 0,
    ligacoesLigarDepois: 0,
    ligacoesAgendadas: 0,
    ligacoesMarcadas: 0,
  });

  const dadosPizza = [
    { name: 'Atendeu', value: totaisGerais.ligacoesAtendidas },
    { name: 'Não Atendeu', value: totaisGerais.ligacoesNaoAtendidas },
    { name: 'Ligar Depois', value: totaisGerais.ligacoesLigarDepois },
    { name: 'Agendou', value: totaisGerais.ligacoesAgendadas },
    { name: 'Marcou', value: totaisGerais.ligacoesMarcadas },
  ].filter(item => item.value > 0);

  if (isLoading) {
    return <div className="text-center py-8">Carregando relatórios...</div>;
  }

  if (relatorios.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Nenhum relatório de TA encontrado</h3>
        <p className="text-muted-foreground">
          Execute um TA completo para gerar relatórios automáticos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Relatórios de TA</h2>
        <Badge variant="outline" className="text-sm">
          {relatorios.length} relatórios encontrados
        </Badge>
      </div>

      {/* Cards de métricas gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaisGerais.totalLeads}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Ligações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaisGerais.totalLigacoes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totaisGerais.totalLigacoes > 0 
                ? Math.round((totaisGerais.ligacoesAtendidas / totaisGerais.totalLigacoes) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaisGerais.ligacoesAgendadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras - evolução */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução dos Últimos TAs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficoBarras}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Total Leads" fill="hsl(var(--primary))" />
                <Bar dataKey="Ligações" fill="hsl(var(--secondary))" />
                <Bar dataKey="Atendidas" fill="hsl(var(--accent))" />
                <Bar dataKey="Agendadas" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de pizza - distribuição de status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status das Ligações</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de relatórios detalhados */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relatorios.map((relatorio) => (
              <div key={relatorio.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    TA de {format(new Date(relatorio.data_relatorio), "dd/MM/yyyy", { locale: ptBR })}
                  </h4>
                  <Badge variant="outline">
                    {relatorio.total_leads} leads
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Ligações:</span>
                    <div className="font-medium">{relatorio.total_ligacoes}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Atendeu:</span>
                    <div className="font-medium text-green-600">{relatorio.ligacoes_atendidas}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Não Atendeu:</span>
                    <div className="font-medium text-red-600">{relatorio.ligacoes_nao_atendidas}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ligar Depois:</span>
                    <div className="font-medium text-yellow-600">{relatorio.ligacoes_ligar_depois}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Agendou:</span>
                    <div className="font-medium text-blue-600">{relatorio.ligacoes_agendadas}</div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Período: {format(new Date(relatorio.periodo_inicio), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {format(new Date(relatorio.periodo_fim), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}