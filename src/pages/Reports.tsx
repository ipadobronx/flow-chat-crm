import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, BarChart3, ArrowRight, Filter, Download, RefreshCw, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [historico, setHistorico] = useState<TAHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLead, setFiltroLead] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [tipoMudanca, setTipoMudanca] = useState<string>("todas");

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
    const dados = historicoFiltrado.map(item => ({
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

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Relatório do TA
            </h1>
            <p className="text-muted-foreground mt-1">
              Histórico completo de mudanças de etapa dos leads no TA
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {historicoFiltrado.length} registro{historicoFiltrado.length !== 1 ? 's' : ''}
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchHistorico} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por Lead */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar Lead</label>
                <Input
                  placeholder="Nome do lead..."
                  value={filtroLead}
                  onChange={(e) => setFiltroLead(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Tipo de Mudança */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Mudança</label>
                <Select value={tipoMudanca} onValueChange={setTipoMudanca}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="etapa">Apenas Etapas</SelectItem>
                    <SelectItem value="ordem">Apenas Reordenação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Início */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
                <label className="text-sm font-medium">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
              >
                Limpar Filtros
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportarRelatorio}
                disabled={historicoFiltrado.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Mudanças</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Carregando histórico...</span>
              </div>
            ) : historicoFiltrado.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro encontrado</p>
                <p className="text-sm mt-2">Tente ajustar os filtros ou verifique se há leads no TA</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Mudança</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead>Ordem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicoFiltrado.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{item.lead_nome}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.etapa_anterior && (
                              <Badge className={`text-white text-xs ${getEtapaColor(item.etapa_anterior)}`}>
                                {item.etapa_anterior}
                              </Badge>
                            )}
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <Badge className={`text-white text-xs ${getEtapaColor(item.etapa_nova)}`}>
                              {item.etapa_nova}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-sm">
                          {format(new Date(item.data_mudanca), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          <span className="truncate block" title={item.observacoes || ""}>
                            {item.observacoes || "-"}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-sm">
                          {item.ta_order_anterior !== item.ta_order_nova ? (
                            <div className="flex items-center gap-1 text-xs">
                              <span>{item.ta_order_anterior || 0}</span>
                              <ArrowRight className="w-2 h-2" />
                              <span>{item.ta_order_nova || 0}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
      </div>
    </DashboardLayout>
  );
}