import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format, subDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";
import { TADateFilter } from "./TADateFilter";
import { TAMetricCard } from "./TAMetricCard";
import TADynamicChart from "./TADynamicChart";
import { Users, MessageCircle, Phone, Target } from "lucide-react";

type TARelatorio = Tables<"ta_relatorios">;

export function TAReports() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [activeCard, setActiveCard] = useState<string>("leads-contactados");
  const [preset, setPreset] = useState<string>("7days");

  const { data: relatorios = [], isLoading } = useQuery({
    queryKey: ["ta-relatorios", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("ta_relatorios")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_relatorio", format(startDate, "yyyy-MM-dd"))
        .lte("data_relatorio", format(endDate, "yyyy-MM-dd"))
        .order("data_relatorio", { ascending: false });
      
      if (error) throw error;
      return data as TARelatorio[];
    },
    enabled: !!user?.id && !!startDate && !!endDate,
  });

  // Filtrar relatórios do período anterior para comparação
  const getPreviousPeriodData = () => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = subDays(startDate, daysDiff);
    const previousEnd = subDays(endDate, daysDiff);
    
    return relatorios.filter(rel => {
      const relDate = new Date(rel.data_relatorio);
      return isWithinInterval(relDate, { start: previousStart, end: previousEnd });
    });
  };

  const previousPeriodData = getPreviousPeriodData();

  // Calcular totais do período atual
  const totaisAtuais = relatorios.reduce((acc, rel) => ({
    totalLeads: acc.totalLeads + rel.total_leads,
    contatosEfetuados: acc.contatosEfetuados + rel.ligacoes_atendidas,
    ligacoesNaoAtendidas: acc.ligacoesNaoAtendidas + rel.ligacoes_nao_atendidas,
    marcarWhatsapp: acc.marcarWhatsapp + rel.ligacoes_marcadas,
    ligarDepois: acc.ligarDepois + rel.ligacoes_ligar_depois,
    oisAgendados: acc.oisAgendados + rel.ligacoes_agendadas,
  }), {
    totalLeads: 0,
    contatosEfetuados: 0,
    ligacoesNaoAtendidas: 0,
    marcarWhatsapp: 0,
    ligarDepois: 0,
    oisAgendados: 0,
  });

  // Calcular totais do período anterior
  const totaisAnteriores = previousPeriodData.reduce((acc, rel) => ({
    totalLeads: acc.totalLeads + rel.total_leads,
    contatosEfetuados: acc.contatosEfetuados + rel.ligacoes_atendidas,
    ligacoesNaoAtendidas: acc.ligacoesNaoAtendidas + rel.ligacoes_nao_atendidas,
    marcarWhatsapp: acc.marcarWhatsapp + rel.ligacoes_marcadas,
    ligarDepois: acc.ligarDepois + rel.ligacoes_ligar_depois,
    oisAgendados: acc.oisAgendados + rel.ligacoes_agendadas,
  }), {
    totalLeads: 0,
    contatosEfetuados: 0,
    ligacoesNaoAtendidas: 0,
    marcarWhatsapp: 0,
    ligarDepois: 0,
    oisAgendados: 0,
  });

  // Calcular métricas derivadas
  const naoTemInteresse = Math.max(0, totaisAtuais.ligacoesNaoAtendidas - totaisAtuais.ligarDepois);
  const naoConseguiuContato = totaisAtuais.ligacoesNaoAtendidas + (totaisAtuais.marcarWhatsapp - totaisAtuais.oisAgendados);

  // Preparar dados para os gráficos
  const chartData = {
    leadsContactados: [
      { name: "Contatos efetuados", atual: totaisAtuais.contatosEfetuados, anterior: totaisAnteriores.contatosEfetuados },
      { name: "Ligações não atendidas", atual: totaisAtuais.ligacoesNaoAtendidas, anterior: totaisAnteriores.ligacoesNaoAtendidas },
      { name: "Marcar WhatsApp", atual: totaisAtuais.marcarWhatsapp, anterior: totaisAnteriores.marcarWhatsapp },
      { name: "Ligar Depois", atual: totaisAtuais.ligarDepois, anterior: totaisAnteriores.ligarDepois },
      { name: "OIs Agendados", atual: totaisAtuais.oisAgendados, anterior: totaisAnteriores.oisAgendados },
      { name: "Não tem interesse", atual: naoTemInteresse, anterior: Math.max(0, totaisAnteriores.ligacoesNaoAtendidas - totaisAnteriores.ligarDepois) }
    ],
    marcarWhatsapp: [
      { name: "OIs Agendados", atual: totaisAtuais.oisAgendados, anterior: totaisAnteriores.oisAgendados },
      { name: "Foi ignorado (continua no Marcar)", atual: Math.max(0, totaisAtuais.marcarWhatsapp - totaisAtuais.oisAgendados), anterior: Math.max(0, totaisAnteriores.marcarWhatsapp - totaisAnteriores.oisAgendados) },
      { name: "Não tem interesse", atual: naoTemInteresse, anterior: Math.max(0, totaisAnteriores.ligacoesNaoAtendidas - totaisAnteriores.ligarDepois) }
    ],
    ligarDepois: [
      { name: "OIs Agendados", atual: totaisAtuais.oisAgendados, anterior: totaisAnteriores.oisAgendados },
      { name: "Não atendeu/ignorado (mantém Ligar Depois)", atual: totaisAtuais.ligarDepois, anterior: totaisAnteriores.ligarDepois },
      { name: "Não teve interesse", atual: naoTemInteresse, anterior: Math.max(0, totaisAnteriores.ligacoesNaoAtendidas - totaisAnteriores.ligarDepois) }
    ],
    resultadoGeral: [
      { name: "Contatos Efetuados", atual: totaisAtuais.contatosEfetuados, anterior: totaisAnteriores.contatosEfetuados },
      { name: "OIs Agendados (Total)", atual: totaisAtuais.oisAgendados, anterior: totaisAnteriores.oisAgendados },
      { name: "Não tem interesse (Total)", atual: naoTemInteresse, anterior: Math.max(0, totaisAnteriores.ligacoesNaoAtendidas - totaisAnteriores.ligarDepois) },
      { name: "Não conseguiu contato", atual: naoConseguiuContato, anterior: totaisAnteriores.ligacoesNaoAtendidas + (totaisAnteriores.marcarWhatsapp - totaisAnteriores.oisAgendados) }
    ]
  };

  const [periodFilter, setPeriodFilter] = useState<number>(7);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  const handlePresetChange = (presetValue: string) => {
    setPreset(presetValue);
    setChartLoading(true);
    
    if (presetValue === "7days") {
      setStartDate(subDays(new Date(), 7));
      setEndDate(new Date());
      setPeriodFilter(7);
    } else if (presetValue === "30days") {
      setStartDate(subDays(new Date(), 30));
      setEndDate(new Date());
      setPeriodFilter(30);
    } else if (presetValue === "90days") {
      setStartDate(subDays(new Date(), 90));
      setEndDate(new Date());
      setPeriodFilter(90);
    }
    
    // Simular loading para demonstrar a funcionalidade
    setTimeout(() => setChartLoading(false), 500);
  };

  const handlePeriodChange = (period: number) => {
    setChartLoading(true);
    setPeriodFilter(period);
    setStartDate(subDays(new Date(), period));
    setEndDate(new Date());
    
    setTimeout(() => setChartLoading(false), 500);
  };

  const formatPeriod = (date: Date) => format(date, "dd/MM", { locale: ptBR });
  const currentPeriod = `${formatPeriod(startDate)} - ${formatPeriod(endDate)}`;
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const previousStart = subDays(startDate, daysDiff);
  const previousEnd = subDays(endDate, daysDiff);
  const previousPeriod = `${formatPeriod(previousStart)} - ${formatPeriod(previousEnd)}`;

  if (isLoading) {
    return <div className="text-center py-8">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com filtro de data */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard TA Interativo</h2>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {relatorios.length} relatórios no período
          </Badge>
          <TADateFilter
            startDate={startDate}
            endDate={endDate}
            preset={preset}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onPresetChange={handlePresetChange}
          />
        </div>
      </div>

      {/* Cards principais em linha 1x4 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TAMetricCard
          title="Leads Contactados"
          value={totaisAtuais.totalLeads}
          icon={<Users className="h-6 w-6" />}
          isActive={activeCard === "leads-contactados"}
          onClick={() => setActiveCard("leads-contactados")}
          gradient="bg-gradient-primary"
        />
        
        <TAMetricCard
          title="Marcar no WhatsApp"
          value={totaisAtuais.marcarWhatsapp}
          icon={<MessageCircle className="h-6 w-6" />}
          isActive={activeCard === "marcar-whatsapp"}
          onClick={() => setActiveCard("marcar-whatsapp")}
          gradient="bg-gradient-success"
        />
        
        <TAMetricCard
          title="Ligar Depois"
          value={totaisAtuais.ligarDepois}
          icon={<Phone className="h-6 w-6" />}
          isActive={activeCard === "ligar-depois"}
          onClick={() => setActiveCard("ligar-depois")}
          gradient="bg-gradient-to-br from-warning to-warning/80"
        />
        
        <TAMetricCard
          title="Resultado Geral do TA"
          value={totaisAtuais.oisAgendados}
          icon={<Target className="h-6 w-6" />}
          isActive={activeCard === "resultado-geral"}
          onClick={() => setActiveCard("resultado-geral")}
          gradient="bg-gradient-to-br from-chart-4 to-destructive"
        />
      </div>

      {/* Gráfico dinâmico */}
      <TADynamicChart
        activeCard={activeCard}
        data={chartData}
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        periodFilter={periodFilter}
        isLoading={chartLoading}
        onPeriodChange={handlePeriodChange}
      />

      {/* Resumo rápido do período */}
      {relatorios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-card border rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground">Taxa de Conversão OI</h4>
            <p className="text-2xl font-bold text-chart-1">
              {totaisAtuais.contatosEfetuados > 0 ? Math.round((totaisAtuais.oisAgendados / totaisAtuais.contatosEfetuados) * 100) : 0}%
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground">Total de Contatos</h4>
            <p className="text-2xl font-bold text-chart-2">{totaisAtuais.contatosEfetuados}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground">Não Conseguiu Contato</h4>
            <p className="text-2xl font-bold text-chart-4">{naoConseguiuContato}</p>
          </div>
        </div>
      )}
    </div>
  );
}