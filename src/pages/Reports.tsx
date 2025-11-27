import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TAReportsUpdated } from "@/components/reports/TAReportsUpdated";
import { TADateFilter } from "@/components/reports/TADateFilter";
import { KPICardGlass } from "@/components/reports/KPICardGlass";
import { SalesFunnelChartGlass } from "@/components/reports/SalesFunnelChartGlass";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LiquidGlassInput from "@/components/ui/liquid-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarIcon, BarChart3, ArrowRight, Filter, Download, RefreshCw, User, Clock,
  Users, Phone, Calendar as CalendarLucide, FileText, CheckCircle, Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useKPIMetrics } from "@/hooks/dashboard/useKPIMetrics";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIsTablet } from "@/hooks/use-tablet";

interface TAHistorico {
  id: string;
  lead_id: string;
  lead_nome: string;
  etapa_anterior: string | null;
  etapa_nova: string;
  data_mudanca: string;
  observacoes: string | null;
  ta_order_anterior: number | null;
  ta_order_nova: number | null;
}

export default function Reports() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isTablet } = useIsTablet();
  const [historico, setHistorico] = useState<TAHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLead, setFiltroLead] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [tipoMudanca, setTipoMudanca] = useState<string>("todas");

  // Dashboard states
  const [dashboardPeriod, setDashboardPeriod] = useState("7dias");
  const [dashboardStartDate, setDashboardStartDate] = useState<Date>(subDays(new Date(), 7));
  const [dashboardEndDate, setDashboardEndDate] = useState<Date>(new Date());

  const { data: kpiData, isLoading: kpiLoading } = useKPIMetrics(dashboardStartDate, dashboardEndDate);

  const fetchHistorico = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_ta_historico', {
        p_user_id: user.id,
        p_start_date: dataInicio?.toISOString(),
        p_end_date: dataFim?.toISOString(),
        p_limit: 200
      });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico do TA:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico do TA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [user, dataInicio, dataFim]);

  const historicoFiltrado = historico.filter(item => {
    if (filtroLead && !item.lead_nome.toLowerCase().includes(filtroLead.toLowerCase())) {
      return false;
    }
    
    if (tipoMudanca === "etapa" && item.etapa_anterior === item.etapa_nova) {
      return false;
    }
    
    if (tipoMudanca === "ordem" && item.etapa_anterior !== item.etapa_nova) {
      return false;
    }

    return true;
  });

  // Agrupar por lead e mostrar apenas a mudança mais recente de cada lead
  const historicoGrouped = historicoFiltrado.reduce((acc, item) => {
    const existingLead = acc.find(lead => lead.lead_id === item.lead_id);
    
    if (!existingLead) {
      acc.push(item);
    } else {
      // Se já existe, manter apenas o mais recente
      if (new Date(item.data_mudanca) > new Date(existingLead.data_mudanca)) {
        const index = acc.findIndex(lead => lead.lead_id === item.lead_id);
        acc[index] = item;
      }
    }
    
    return acc;
  }, [] as TAHistorico[]);

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case "Novo": return "bg-sky-500";
      case "OI": return "bg-indigo-500";
      case "Delay OI": return "bg-indigo-600";
      case "PC": return "bg-orange-500";
      case "Delay PC": return "bg-red-500";
      case "Analisando Proposta": return "bg-orange-600";
      case "N": return "bg-purple-500";
      case "Não": return "bg-purple-600";
      case "Apólice Emitida": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const exportarRelatorio = () => {
    const dados = historicoGrouped.map(item => ({
      Lead: item.lead_nome,
      "Etapa Anterior": item.etapa_anterior || "Sem etapa",
      "Etapa Nova": item.etapa_nova,
      "Data da Mudança": format(new Date(item.data_mudanca), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      "Observações": item.observacoes || "",
      "Ordem Anterior": item.ta_order_anterior || "",
      "Ordem Nova": item.ta_order_nova || ""
    }));

    const csv = [
      Object.keys(dados[0]).join(","),
      ...dados.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-ta-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // KPI Cards config
  const kpiCards = [
    { 
      title: "Nº de rec", 
      key: "total_rec", 
      taxaKey: "taxa_conversao_ligacao",
      icon: Users, 
      iconColor: "text-blue-400",
      iconBgColor: "bg-blue-500/20",
      subtitle: "total de recomendações"
    },
    { 
      title: "Ligações", 
      key: "total_ligacoes", 
      taxaKey: "taxa_conversao_ligacao",
      icon: Phone, 
      iconColor: "text-green-400",
      iconBgColor: "bg-green-500/20",
      subtitle: "taxa de conversão"
    },
    { 
      title: "OIs Agendados", 
      key: "total_oi_agendados", 
      taxaKey: "taxa_conversao_oi",
      icon: CalendarLucide, 
      iconColor: "text-amber-400",
      iconBgColor: "bg-amber-500/20",
      subtitle: "taxa de conversão"
    },
    { 
      title: "Proposta apresentada", 
      key: "total_proposta_apresentada", 
      taxaKey: "taxa_conversao_proposta",
      icon: FileText, 
      iconColor: "text-purple-400",
      iconBgColor: "bg-purple-500/20",
      subtitle: "taxa de conversão"
    },
    { 
      title: "N Realizado", 
      key: "total_n_realizado", 
      taxaKey: "taxa_conversao_n",
      icon: CheckCircle, 
      iconColor: "text-cyan-400",
      iconBgColor: "bg-cyan-500/20",
      subtitle: "taxa de conversão"
    },
    { 
      title: "Apólice Emitida", 
      key: "total_apolice_emitida", 
      taxaKey: "taxa_conversao_apolice",
      icon: Award, 
      iconColor: "text-yellow-400",
      iconBgColor: "bg-yellow-500/20",
      subtitle: "taxa de conversão"
    },
  ];

  // Tablet liquid glass classes
  const cardClasses = cn(
    "rounded-[20px]",
    isTablet && "bg-white/5 backdrop-blur-md border-white/10"
  );

  const titleClasses = cn(isTablet && "text-white");
  const subtitleClasses = cn(isTablet ? "text-white/50" : "text-muted-foreground");
  const buttonOutlineClasses = cn(isTablet && "bg-white/10 border-white/20 text-white hover:bg-white/20");

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg rounded-2xl p-1.5 bg-white/5 backdrop-blur-md border border-white/10">
            <TabsTrigger 
              value="dashboard"
              className="rounded-xl px-4 py-2 text-sm font-inter font-normal text-white/60 
                data-[state=active]:bg-[#d4ff4a] data-[state=active]:text-black 
                data-[state=active]:font-medium transition-all duration-300"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="metricas"
              className="rounded-xl px-4 py-2 text-sm font-inter font-normal text-white/60 
                data-[state=active]:bg-[#d4ff4a] data-[state=active]:text-black 
                data-[state=active]:font-medium transition-all duration-300"
            >
              Métricas de TA
            </TabsTrigger>
            <TabsTrigger 
              value="historico"
              className="rounded-xl px-4 py-2 text-sm font-inter font-normal text-white/60 
                data-[state=active]:bg-[#d4ff4a] data-[state=active]:text-black 
                data-[state=active]:font-medium transition-all duration-300"
            >
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Nova Tab Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Date Filter */}
            <TADateFilter
              startDate={dashboardStartDate}
              endDate={dashboardEndDate}
              preset={dashboardPeriod}
              onStartDateChange={(date) => date && setDashboardStartDate(date)}
              onEndDateChange={(date) => date && setDashboardEndDate(date)}
              onPresetChange={setDashboardPeriod}
            />

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpiCards.map(card => (
                <KPICardGlass
                  key={card.key}
                  title={card.title}
                  value={(kpiData as any)?.[card.key] || 0}
                  percentageChange={(kpiData as any)?.[card.taxaKey] || 0}
                  icon={card.icon}
                  iconColor={card.iconColor}
                  iconBgColor={card.iconBgColor}
                  subtitle={card.subtitle}
                />
              ))}
            </div>

            {/* Funnel Chart */}
            <SalesFunnelChartGlass 
              startDate={dashboardStartDate} 
              endDate={dashboardEndDate} 
            />
          </TabsContent>

          <TabsContent value="metricas" className="space-y-6">
            <TAReportsUpdated />
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={cn("text-xl font-semibold", titleClasses)}>Histórico de Mudanças no TA</h2>
                <p className={subtitleClasses}>
                  Histórico detalhado de mudanças de etapa dos leads no TA
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn("flex items-center gap-1", isTablet && "bg-white/10 text-white border-white/20")}>
                  <Clock className="w-3 h-3" />
                  {historicoGrouped.length} registro{historicoGrouped.length !== 1 ? 's' : ''}
                </Badge>
                <Button variant="outline" size="sm" onClick={fetchHistorico} disabled={loading} className={buttonOutlineClasses}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            </div>

        {/* Filtros */}
        <Card className={cardClasses}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", titleClasses)}>
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por Lead */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", titleClasses)}>Buscar Lead</label>
                <LiquidGlassInput
                  placeholder="Nome do lead..."
                  value={filtroLead}
                  onChange={(e) => setFiltroLead(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Tipo de Mudança */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", titleClasses)}>Tipo de Mudança</label>
                <Select value={tipoMudanca} onValueChange={setTipoMudanca}>
                  <SelectTrigger className={cn(isTablet && "bg-white/10 border-white/20 text-white")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={cn(isTablet && "bg-black/90 border-white/20")}>
                    <SelectItem value="todas" className={cn(isTablet && "text-white focus:bg-white/10")}>Todas</SelectItem>
                    <SelectItem value="etapa" className={cn(isTablet && "text-white focus:bg-white/10")}>Apenas Etapas</SelectItem>
                    <SelectItem value="ordem" className={cn(isTablet && "text-white focus:bg-white/10")}>Apenas Reordenação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Início */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", titleClasses)}>Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataInicio && (isTablet ? "text-white/50" : "text-muted-foreground"),
                        buttonOutlineClasses
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={cn("w-auto p-0", isTablet && "bg-black/90 border-white/20")}>
                    <Calendar
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Fim */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", titleClasses)}>Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataFim && (isTablet ? "text-white/50" : "text-muted-foreground"),
                        buttonOutlineClasses
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={cn("w-auto p-0", isTablet && "bg-black/90 border-white/20")}>
                    <Calendar
                      mode="single"
                      selected={dataFim}
                      onSelect={setDataFim}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFiltroLead("");
                  setDataInicio(undefined);
                  setDataFim(undefined);
                  setTipoMudanca("todas");
                }}
                className={buttonOutlineClasses}
              >
                Limpar Filtros
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportarRelatorio}
                disabled={historicoGrouped.length === 0}
                className={buttonOutlineClasses}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Histórico */}
        <Card className={cardClasses}>
          <CardHeader>
            <CardTitle className={titleClasses}>Histórico de Mudanças</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className={cn("flex items-center justify-center py-8", titleClasses)}>
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Carregando histórico...</span>
              </div>
            ) : historicoGrouped.length === 0 ? (
              <div className={cn("text-center py-8", subtitleClasses)}>
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro encontrado</p>
                <p className="text-sm mt-2">Tente ajustar os filtros ou verifique se há leads no TA</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className={cn(isTablet && "border-white/10")}>
                      <TableHead className={cn(isTablet && "text-white/70")}>Lead</TableHead>
                      <TableHead className={cn(isTablet && "text-white/70")}>Mudança</TableHead>
                      <TableHead className={cn(isTablet && "text-white/70")}>Data/Hora</TableHead>
                      <TableHead className={cn(isTablet && "text-white/70")}>Observações</TableHead>
                      <TableHead className={cn(isTablet && "text-white/70")}>Ordem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicoGrouped.map((item) => (
                      <TableRow key={item.id} className={cn(isTablet && "border-white/10 hover:bg-white/5")}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className={cn("w-4 h-4", isTablet ? "text-white/50" : "text-muted-foreground")} />
                            <span className={cn("font-medium", titleClasses)}>{item.lead_nome}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.etapa_anterior && (
                              <Badge className={`text-white text-xs ${getEtapaColor(item.etapa_anterior)}`}>
                                {item.etapa_anterior}
                              </Badge>
                            )}
                            <ArrowRight className={cn("w-3 h-3", isTablet ? "text-white/50" : "text-muted-foreground")} />
                            <Badge className={`text-white text-xs ${getEtapaColor(item.etapa_nova)}`}>
                              {item.etapa_nova}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell className={cn("text-sm", isTablet && "text-white/70")}>
                          {format(new Date(item.data_mudanca), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        
                        <TableCell className={cn("text-sm max-w-xs", subtitleClasses)}>
                          <span className="truncate block" title={item.observacoes || ""}>
                            {item.observacoes || "-"}
                          </span>
                        </TableCell>
                        
                        <TableCell className={cn("text-sm", isTablet && "text-white/70")}>
                          {item.ta_order_anterior !== item.ta_order_nova ? (
                            <div className="flex items-center gap-1 text-xs">
                              <span>{item.ta_order_anterior || 0}</span>
                              <ArrowRight className="w-2 h-2" />
                              <span>{item.ta_order_nova || 0}</span>
                            </div>
                          ) : (
                            <span className={subtitleClasses}>-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
