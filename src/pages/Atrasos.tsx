import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Phone, MessageCircle, AlertTriangle, Settings, Plus, ClockIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsTablet } from "@/hooks/use-tablet";
import { cn } from "@/lib/utils";

type AtrasosData = Tables<"atrasos">;

export default function Atrasos() {
  const { isTablet } = useIsTablet();
  const [atrasos, setAtrasos] = useState<AtrasosData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<AtrasosData | null>(null);

  useEffect(() => {
    fetchAtrasos();
  }, []);

  const fetchAtrasos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("atrasos")
        .select("*");

      if (error) throw error;
      setAtrasos(data || []);
    } catch (error) {
      console.error("Erro ao buscar atrasos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "R$ 0,00";
    const numValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(numValue || 0);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getDiasAtrasoColor = (dias: number | null) => {
    if (!dias) return isTablet ? "text-white/50" : "text-muted-foreground";
    if (dias <= 30) return "text-yellow-500";
    if (dias <= 60) return "text-orange-500";
    return "text-red-500";
  };

  // Tablet liquid glass classes
  const cardClasses = cn(
    "rounded-[20px]",
    isTablet && "bg-white/5 backdrop-blur-md border-white/10"
  );

  const titleClasses = cn(
    isTablet && "text-white"
  );

  const subtitleClasses = cn(
    isTablet ? "text-white/50" : "text-muted-foreground"
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={cn("text-2xl sm:text-3xl font-bold", titleClasses)}>Atrasos</h1>
              <p className={subtitleClasses}>Gestão de apólices com pagamentos em atraso</p>
            </div>
          </div>
          
          <Card className={cardClasses}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", titleClasses)}>
                <Clock className="w-5 h-5" />
                Carregando dados...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className={cn("h-4 w-20", isTablet && "bg-white/10")} />
                    <Skeleton className={cn("h-4 w-32", isTablet && "bg-white/10")} />
                    <Skeleton className={cn("h-4 w-24", isTablet && "bg-white/10")} />
                    <Skeleton className={cn("h-4 w-28", isTablet && "bg-white/10")} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (atrasos.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={cn("text-2xl sm:text-3xl font-bold", titleClasses)}>Atrasos</h1>
              <p className={subtitleClasses}>Gestão de apólices com pagamentos em atraso</p>
            </div>
          </div>
          
          <Card className={cn(cardClasses, "text-center py-12")}>
            <CardContent>
              <ClockIcon className={cn("w-16 h-16 mx-auto mb-4", isTablet ? "text-white/50" : "text-muted-foreground")} />
              <h3 className={cn("text-lg font-medium mb-2", titleClasses)}>Nenhum atraso encontrado</h3>
              <p className={subtitleClasses}>Não há apólices com pagamentos em atraso no momento.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={cn("text-2xl sm:text-3xl font-bold", titleClasses)}>Atrasos</h1>
            <p className={subtitleClasses}>Gestão de apólices com pagamentos em atraso</p>
          </div>
          <Badge variant="secondary" className={cn("w-fit", isTablet && "bg-white/10 text-white border-white/20")}>
            {atrasos.length} atraso{atrasos.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <Card className={cardClasses}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", titleClasses)}>
              <Clock className="w-5 h-5" />
              Lista de Atrasos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={cn(isTablet && "border-white/10")}>
                    <TableHead className={cn("w-[100px]", isTablet && "text-white/70")}>Persistência</TableHead>
                    <TableHead className={cn("w-[120px]", isTablet && "text-white/70")}>Dias Atraso</TableHead>
                    <TableHead className={cn("min-w-[200px]", isTablet && "text-white/70")}>Nome do Segurado</TableHead>
                    <TableHead className={cn("w-[120px]", isTablet && "text-white/70")}>Prêmio</TableHead>
                    <TableHead className={cn("w-[150px]", isTablet && "text-white/70")}>Forma Pagto</TableHead>
                    <TableHead className={cn("w-[120px]", isTablet && "text-white/70")}>Emissão</TableHead>
                    <TableHead className={cn("w-[120px]", isTablet && "text-white/70")}>Vencimento</TableHead>
                    <TableHead className={cn("min-w-[200px] max-w-[300px]", isTablet && "text-white/70")}>Última Mensagem</TableHead>
                    <TableHead className={cn("w-[120px]", isTablet && "text-white/70")}>Status</TableHead>
                    <TableHead className={cn("min-w-[200px] max-w-[300px]", isTablet && "text-white/70")}>Comentário</TableHead>
                    <TableHead className={cn("w-[120px]", isTablet && "text-white/70")}>Tratado Em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atrasos.map((atraso) => (
                    <TableRow key={atraso.Apólice} className={cn(
                      isTablet ? "hover:bg-white/5 border-white/10" : "hover:bg-muted/50"
                    )}>
                      <TableCell className={cn("font-normal text-sm", isTablet && "text-white/70")}>
                        {atraso.Peristência || "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getDiasAtrasoColor((atraso as any).dias_atraso_calculado)}`}>
                          {(atraso as any).dias_atraso_calculado || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="link" 
                              className={cn(
                                "p-0 h-auto font-medium text-left justify-start",
                                isTablet ? "text-[#d4ff4a] hover:text-[#d4ff4a]/80" : "text-primary hover:text-primary/80"
                              )}
                              onClick={() => setSelectedClient(atraso)}
                            >
                              <span className="truncate max-w-[180px]">
                                {atraso.Segurado || atraso["PRIMEIRO NOME"] || "Sem nome"}
                              </span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className={cn(
                            "max-w-2xl max-h-[90vh] overflow-y-auto",
                            isTablet && "bg-black/80 backdrop-blur-xl border-white/20"
                          )}>
                            <DialogHeader>
                              <DialogTitle className={cn("text-lg font-bold", isTablet ? "text-[#d4ff4a]" : "text-red-600")}>
                                {atraso.Segurado || atraso["PRIMEIRO NOME"] || "Cliente"}
                              </DialogTitle>
                              <DialogDescription className={cn(isTablet && "text-white/50")}>
                                Detalhes completos da apólice e histórico de tratativas
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Ações Rápidas */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Button variant="outline" size="sm" className={cn("w-full", isTablet && "bg-white/10 border-white/20 text-white hover:bg-white/20")}>
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Aviso LP</span>
                                </Button>
                                <Button variant="outline" size="sm" className={cn("w-full", isTablet && "bg-white/10 border-white/20 text-white hover:bg-white/20")}>
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Reforçar</span>
                                </Button>
                                <Button variant="outline" size="sm" className={cn("w-full", isTablet && "bg-white/10 border-white/20 text-white hover:bg-white/20")}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Alt. Pagto</span>
                                </Button>
                                <Button variant="outline" size="sm" className={cn("w-full", isTablet && "bg-white/10 border-white/20 text-white hover:bg-white/20")}>
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Assistente</span>
                                </Button>
                              </div>

                              {/* Histórico de Contato */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className={cn("font-medium", isTablet && "text-white")}>Histórico de Contato</h3>
                                  <Button size="sm" variant="outline" className={cn(isTablet && "bg-white/10 border-white/20 text-white hover:bg-white/20")}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar
                                  </Button>
                                </div>
                                <div className={cn(
                                  "text-sm p-3 rounded-lg",
                                  isTablet ? "bg-white/5 text-white/70" : "text-muted-foreground bg-muted/50"
                                )}>
                                  {atraso["Histórico de Contatos e Tratativas"] || "Nenhum histórico registrado"}
                                </div>
                              </div>

                              {/* Informações da Apólice */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Carregado em</label>
                                    <p className={cn("text-sm", isTablet && "text-white")}>{atraso["Carregado em"] || "-"}</p>
                                  </div>
                                  
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Celular</label>
                                    <div className="flex items-center gap-2">
                                      <p className={cn("text-sm", isTablet && "text-white")}>{atraso.Celular || "-"}</p>
                                      {atraso.Celular && (
                                        <div className="flex gap-1">
                                          <Button size="sm" variant="ghost" className={cn("p-1 h-6 w-6", isTablet && "text-white hover:bg-white/10")}>
                                            <Phone className="w-3 h-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className={cn("p-1 h-6 w-6", isTablet && "text-white hover:bg-white/10")}>
                                            <MessageCircle className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Apólice</label>
                                    <p className={cn("text-sm font-medium", isTablet && "text-white")}>{atraso.Apólice}</p>
                                  </div>
                                  
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Emissão</label>
                                    <p className={cn("text-sm font-medium", isTablet ? "text-[#d4ff4a]" : "text-red-600")}>{formatDate(atraso.Emissão)}</p>
                                  </div>
                                  
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Vencido em</label>
                                    <p className={cn("text-sm", isTablet && "text-white")}>{formatDate(atraso["Vencido Em"])}</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Melhor Dia</label>
                                    <p className={cn("text-sm font-medium", isTablet ? "text-purple-400" : "text-purple-600")}>{atraso["Melhor Dia"] || "-"}</p>
                                  </div>
                                  
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Dias Atraso</label>
                                    <p className={`text-sm font-medium ${getDiasAtrasoColor((atraso as any).dias_atraso_calculado)}`}>
                                      {(atraso as any).dias_atraso_calculado || 0} dias
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Prêmio</label>
                                    <p className={cn("text-sm font-medium", isTablet ? "text-[#d4ff4a]" : "text-red-600")}>{formatCurrency(atraso.Prêmio)}</p>
                                  </div>
                                  
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Forma de Pagamento</label>
                                    <p className={cn("text-sm", isTablet && "text-white")}>{atraso["Forma  Pagto."] || "-"}</p>
                                  </div>
                                  
                                  <div>
                                    <label className={cn("text-sm font-medium", isTablet ? "text-white/50" : "text-muted-foreground")}>Última mensagem</label>
                                    <p className={cn("text-sm break-words", isTablet ? "text-white/70" : "text-muted-foreground")}>
                                      {atraso["Última Mensagem Retorno Cobrança Rejeitada"] || "Nenhuma mensagem"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className={cn("font-medium text-sm", isTablet && "text-white")}>
                        {formatCurrency(atraso.Prêmio)}
                      </TableCell>
                      <TableCell className={cn("text-sm", isTablet && "text-white/70")}>
                        <span className="truncate max-w-[120px] inline-block">
                          {atraso["Forma  Pagto."] || "-"}
                        </span>
                      </TableCell>
                      <TableCell className={cn("text-sm", isTablet && "text-white/70")}>
                        {formatDate(atraso.Emissão)}
                      </TableCell>
                      <TableCell className={cn("text-sm", isTablet && "text-white/70")}>
                        {formatDate(atraso["Vencido Em"])}
                      </TableCell>
                      <TableCell className={cn("text-sm", isTablet && "text-white/50")}>
                        <span className="truncate max-w-[200px] inline-block" title={atraso["Última Mensagem Retorno Cobrança Rejeitada"] || ""}>
                          {atraso["Última Mensagem Retorno Cobrança Rejeitada"] || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {atraso.Status ? (
                          <Badge variant="outline" className={cn("text-xs", isTablet && "bg-white/10 text-white border-white/20")}>
                            {atraso.Status}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className={cn("text-sm", isTablet && "text-white/50")}>
                        <span className="truncate max-w-[200px] inline-block" title={atraso.Comentário || ""}>
                          {atraso.Comentário || "-"}
                        </span>
                      </TableCell>
                      <TableCell className={cn("text-sm", isTablet && "text-white/70")}>
                        {formatDate(atraso["Tratado em"])}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}