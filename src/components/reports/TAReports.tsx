import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Tables } from "@/integrations/supabase/types";
import { Phone, Users, TrendingUp, Calendar, ArrowUp, ArrowDown, Minus } from "lucide-react";

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

  // Calcular totais gerais e comparação com período anterior
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

  // Calcular totais do período anterior (últimos 50% dos relatórios)
  const metadeRelatorios = Math.floor(relatorios.length / 2);
  const relatoriosAnteriores = relatorios.slice(metadeRelatorios);
  const relatoriosRecentes = relatorios.slice(0, metadeRelatorios);

  const totaisAnteriores = relatoriosAnteriores.reduce((acc, rel) => ({
    totalLeads: acc.totalLeads + rel.total_leads,
    totalLigacoes: acc.totalLigacoes + rel.total_ligacoes,
    ligacoesAtendidas: acc.ligacoesAtendidas + rel.ligacoes_atendidas,
    ligacoesAgendadas: acc.ligacoesAgendadas + rel.ligacoes_agendadas,
  }), { totalLeads: 0, totalLigacoes: 0, ligacoesAtendidas: 0, ligacoesAgendadas: 0 });

  const totaisRecentes = relatoriosRecentes.reduce((acc, rel) => ({
    totalLeads: acc.totalLeads + rel.total_leads,
    totalLigacoes: acc.totalLigacoes + rel.total_ligacoes,
    ligacoesAtendidas: acc.ligacoesAtendidas + rel.ligacoes_atendidas,
    ligacoesAgendadas: acc.ligacoesAgendadas + rel.ligacoes_agendadas,
  }), { totalLeads: 0, totalLigacoes: 0, ligacoesAtendidas: 0, ligacoesAgendadas: 0 });

  // Calcular percentuais de mudança
  const calcularPercentualMudanca = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Math.round(((atual - anterior) / anterior) * 100);
  };

  const percentualLeads = calcularPercentualMudanca(totaisRecentes.totalLeads, totaisAnteriores.totalLeads);
  const percentualLigacoes = calcularPercentualMudanca(totaisRecentes.totalLigacoes, totaisAnteriores.totalLigacoes);
  const percentualAtendimento = calcularPercentualMudanca(
    totaisRecentes.totalLigacoes > 0 ? (totaisRecentes.ligacoesAtendidas / totaisRecentes.totalLigacoes) * 100 : 0,
    totaisAnteriores.totalLigacoes > 0 ? (totaisAnteriores.ligacoesAtendidas / totaisAnteriores.totalLigacoes) * 100 : 0
  );
  const percentualAgendamentos = calcularPercentualMudanca(totaisRecentes.ligacoesAgendadas, totaisAnteriores.ligacoesAgendadas);

  const renderPercentualChange = (percentual: number) => {
    if (percentual > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm font-medium">
          <ArrowUp className="w-4 h-4 mr-1" />
          {percentual}%
        </div>
      );
    } else if (percentual < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm font-medium">
          <ArrowDown className="w-4 h-4 mr-1" />
          {Math.abs(percentual)}%
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-muted-foreground text-sm font-medium">
          <Minus className="w-4 h-4 mr-1" />
          0%
        </div>
      );
    }
  };

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

      {/* Cards de métricas gerais - Estilo Dashboard Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Leads */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Total de Leads</p>
                <p className="text-3xl font-bold">{totaisGerais.totalLeads.toLocaleString('pt-BR')}</p>
                {renderPercentualChange(percentualLeads)}
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total de Ligações */}
        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Total de Ligações</p>
                <p className="text-3xl font-bold">{totaisGerais.totalLigacoes.toLocaleString('pt-BR')}</p>
                {renderPercentualChange(percentualLigacoes)}
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <Phone className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Taxa de Atendimento */}
        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Taxa de Atendimento</p>
                <p className="text-3xl font-bold">
                  {totaisGerais.totalLigacoes > 0 
                    ? Math.round((totaisGerais.ligacoesAtendidas / totaisGerais.totalLigacoes) * 100)
                    : 0}%
                </p>
                {renderPercentualChange(percentualAtendimento)}
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Agendamentos */}
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Agendamentos</p>
                <p className="text-3xl font-bold">{totaisGerais.ligacoesAgendadas.toLocaleString('pt-BR')}</p>
                {renderPercentualChange(percentualAgendamentos)}
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico principal - Estilo Dashboard Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de barras - Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resumo de Desempenho dos TAs</CardTitle>
            <p className="text-sm text-muted-foreground">Evolução dos principais indicadores ao longo do tempo</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              totalLeads: { label: "Total Leads", color: "hsl(220, 70%, 50%)" },
              ligacoes: { label: "Ligações", color: "hsl(142, 76%, 36%)" },
              atendidas: { label: "Atendidas", color: "hsl(24, 95%, 53%)" },
              agendadas: { label: "Agendadas", color: "hsl(262, 83%, 58%)" }
            }} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="data" 
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    stroke="currentColor"
                    opacity={0.7}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    stroke="currentColor"
                    opacity={0.7}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Bar dataKey="Total Leads" fill="hsl(220, 70%, 50%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Ligações" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Atendidas" fill="hsl(24, 95%, 53%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Agendadas" fill="hsl(262, 83%, 58%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Resumo de Conversão */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Taxa de Conversão</CardTitle>
            <p className="text-sm text-muted-foreground">Performance geral</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Taxa principal */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {totaisGerais.totalLigacoes > 0 
                  ? Math.round((totaisGerais.ligacoesAtendidas / totaisGerais.totalLigacoes) * 100)
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Taxa de atendimento geral</p>
            </div>
            
            {/* Distribuição dos status */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Distribuição de Resultados</h4>
              {dadosPizza.map((item, index) => {
                const percentage = totaisGerais.totalLigacoes > 0 
                  ? Math.round((item.value / totaisGerais.totalLigacoes) * 100)
                  : 0;
                
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.value}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
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