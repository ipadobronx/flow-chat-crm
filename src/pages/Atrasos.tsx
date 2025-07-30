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

type AtrasosData = Tables<"atrasos">;

export default function Atrasos() {
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
    if (!dias) return "text-muted-foreground";
    if (dias <= 30) return "text-yellow-600";
    if (dias <= 60) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Atrasos</h1>
              <p className="text-muted-foreground">Gestão de apólices com pagamentos em atraso</p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Carregando dados...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
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
              <h1 className="text-2xl sm:text-3xl font-bold">Atrasos</h1>
              <p className="text-muted-foreground">Gestão de apólices com pagamentos em atraso</p>
            </div>
          </div>
          
          <Card className="text-center py-12">
            <CardContent>
              <ClockIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum atraso encontrado</h3>
              <p className="text-muted-foreground">Não há apólices com pagamentos em atraso no momento.</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold">Atrasos</h1>
            <p className="text-muted-foreground">Gestão de apólices com pagamentos em atraso</p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {atrasos.length} atraso{atrasos.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Lista de Atrasos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Persistência</TableHead>
                    <TableHead className="w-[120px]">Dias Atraso</TableHead>
                    <TableHead className="min-w-[200px]">Nome do Segurado</TableHead>
                    <TableHead className="w-[120px]">Prêmio</TableHead>
                    <TableHead className="w-[150px]">Forma Pagto</TableHead>
                    <TableHead className="w-[120px]">Emissão</TableHead>
                    <TableHead className="w-[120px]">Vencimento</TableHead>
                    <TableHead className="min-w-[200px] max-w-[300px]">Última Mensagem</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[200px] max-w-[300px]">Comentário</TableHead>
                    <TableHead className="w-[120px]">Tratado Em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atrasos.map((atraso) => (
                    <TableRow key={atraso.Apólice} className="hover:bg-muted/50">
                      <TableCell className="font-normal text-sm">
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
                              className="p-0 h-auto font-medium text-left text-primary hover:text-primary/80 justify-start"
                              onClick={() => setSelectedClient(atraso)}
                            >
                              <span className="truncate max-w-[180px]">
                                {atraso.Segurado || atraso["PRIMEIRO NOME"] || "Sem nome"}
                              </span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-red-600 text-lg font-bold">
                                {atraso.Segurado || atraso["PRIMEIRO NOME"] || "Cliente"}
                              </DialogTitle>
                              <DialogDescription>
                                Detalhes completos da apólice e histórico de tratativas
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Ações Rápidas */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Button variant="outline" size="sm" className="w-full">
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Aviso LP</span>
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Reforçar</span>
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Settings className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Alt. Pagto</span>
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Assistente</span>
                                </Button>
                              </div>

                              {/* Histórico de Contato */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">Histórico de Contato</h3>
                                  <Button size="sm" variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar
                                  </Button>
                                </div>
                                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                  {atraso["Histórico de Contatos e Tratativas"] || "Nenhum histórico registrado"}
                                </div>
                              </div>

                              {/* Informações da Apólice */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Carregado em</label>
                                    <p className="text-sm">{atraso["Carregado em"] || "-"}</p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Celular</label>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm">{atraso.Celular || "-"}</p>
                                      {atraso.Celular && (
                                        <div className="flex gap-1">
                                          <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                                            <Phone className="w-3 h-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                                            <MessageCircle className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Apólice</label>
                                    <p className="text-sm font-medium">{atraso.Apólice}</p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Emissão</label>
                                    <p className="text-sm text-red-600 font-medium">{formatDate(atraso.Emissão)}</p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Vencido em</label>
                                    <p className="text-sm">{formatDate(atraso["Vencido Em"])}</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Melhor Dia</label>
                                    <p className="text-sm text-purple-600 font-medium">{atraso["Melhor Dia"] || "-"}</p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Dias Atraso</label>
                                    <p className={`text-sm font-medium ${getDiasAtrasoColor((atraso as any).dias_atraso_calculado)}`}>
                                      {(atraso as any).dias_atraso_calculado || 0} dias
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Prêmio</label>
                                    <p className="text-sm text-red-600 font-medium">{formatCurrency(atraso.Prêmio)}</p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Forma de Pagamento</label>
                                    <p className="text-sm">{atraso["Forma  Pagto."] || "-"}</p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Última mensagem</label>
                                    <p className="text-sm text-muted-foreground break-words">
                                      {atraso["Última Mensagem Retorno Cobrança Rejeitada"] || "Nenhuma mensagem"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {formatCurrency(atraso.Prêmio)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="truncate max-w-[120px] inline-block">
                          {atraso["Forma  Pagto."] || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(atraso.Emissão)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(atraso["Vencido Em"])}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="truncate max-w-[200px] inline-block" title={atraso["Última Mensagem Retorno Cobrança Rejeitada"] || ""}>
                          {atraso["Última Mensagem Retorno Cobrança Rejeitada"] || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {atraso.Status ? (
                          <Badge variant="outline" className="text-xs">
                            {atraso.Status}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="truncate max-w-[200px] inline-block" title={atraso.Comentário || ""}>
                          {atraso.Comentário || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
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