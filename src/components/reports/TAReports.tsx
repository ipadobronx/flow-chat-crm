import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";

type TARelatorio = Tables<"ta_relatorios">;

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

  // Calcular métricas específicas do TA
  const contatosEfetuados = totaisGerais.ligacoesAtendidas;
  const oisAgendados = totaisGerais.ligacoesAgendadas;
  const marcarWhatsapp = totaisGerais.ligacoesMarcadas;
  const naoTemInteresse = Math.max(0, totaisGerais.ligacoesNaoAtendidas - totaisGerais.ligacoesLigarDepois);

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

      {/* Cards específicos do TA - Layout Simples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LEADs contatados diretamente no TA */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">LEADs contatados diretamente no TA</p>
              <p className="text-3xl font-bold">{totaisGerais.totalLeads.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Contatos efetuados */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Contatos efetuados</p>
              <p className="text-3xl font-bold">{contatosEfetuados.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Ligações não atendidas */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Ligações não atendidas</p>
              <p className="text-3xl font-bold">{totaisGerais.ligacoesNaoAtendidas.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Marcar no WhatsApp */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Marcar no WhatsApp</p>
              <p className="text-3xl font-bold">{marcarWhatsapp.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Ligar depois */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Ligar depois</p>
              <p className="text-3xl font-bold">{totaisGerais.ligacoesLigarDepois.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* OIs Agendados */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">OIs Agendados</p>
              <p className="text-3xl font-bold">{oisAgendados.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Não tenho interesse */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Não tenho interesse</p>
              <p className="text-3xl font-bold">{naoTemInteresse.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Meta/Relacionar com datas */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Meta/Relacionar com datas</p>
              <p className="text-lg font-bold">Período: {relatorios.length} relatórios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seções específicas - OIs Agendados e Resultado Geral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OIs Agendados - Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">OIs Agendados - Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Foi ignorado, manter no marcar no wapp no pipe</h4>
                <p className="text-muted-foreground text-xs">Não tem interesse: {naoTemInteresse}</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Não atendeu, foi ignorado, manter no ligar depois no pipe</h4>
                <p className="text-muted-foreground text-xs">Ligar depois: {totaisGerais.ligacoesLigarDepois}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado Geral do TA */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resultado Geral do TA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Contatos efetuados</span>
                <span className="font-medium">{contatosEfetuados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">OIs agendados</span>
                <span className="font-medium">{oisAgendados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Não conseguiu contato</span>
                <span className="font-medium">{totaisGerais.ligacoesNaoAtendidas + totaisGerais.ligacoesLigarDepois + marcarWhatsapp}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Taxa de conversão OI</span>
                  <span className="text-lg">{contatosEfetuados > 0 ? Math.round((oisAgendados / contatosEfetuados) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relatorios.map((relatorio) => (
              <div key={relatorio.id} className="border rounded-lg p-4 space-y-3">
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
                    <span className="text-muted-foreground block">Ligações:</span>
                    <div className="font-medium text-lg">{relatorio.total_ligacoes}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Atendeu:</span>
                    <div className="font-medium text-lg text-green-600">{relatorio.ligacoes_atendidas}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Não Atendeu:</span>
                    <div className="font-medium text-lg text-red-600">{relatorio.ligacoes_nao_atendidas}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Ligar Depois:</span>
                    <div className="font-medium text-lg text-yellow-600">{relatorio.ligacoes_ligar_depois}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Agendou:</span>
                    <div className="font-medium text-lg text-blue-600">{relatorio.ligacoes_agendadas}</div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground pt-2 border-t">
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