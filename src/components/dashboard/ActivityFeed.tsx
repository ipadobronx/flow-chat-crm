import { useState, useEffect } from "react";
import { Clock, MessageSquare, User, Phone, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Atividade {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  tempo: string;
  nome_lead: string;
  icon: any;
}

export function ActivityFeed() {
  const { user } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      buscarAtividades();
    }
  }, [user]);

  // Refrescar atividades a cada 30 segundos para garantir atualização
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-atualizando atividades...');
        buscarAtividades();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [user]);

  const buscarAtividades = async (showRefreshing = false) => {
    if (!user) return;

    if (showRefreshing) setIsRefreshing(true);
    console.log('🔍 Buscando atividades para o usuário:', user.id);

    try {
      // Buscar ligações recentes sem JOIN primeiro para debugar
      const { data: ligacoes, error: ligacoesError } = await supabase
        .from('ligacoes_historico')
        .select('*')
        .eq('user_id', user.id)
        .order('data_ligacao', { ascending: false })
        .limit(20);

      console.log('📞 Ligações encontradas (sem JOIN):', ligacoes);

      if (ligacoesError) {
        console.error('❌ Erro ao buscar ligações:', ligacoesError);
        throw ligacoesError;
      }

      // Buscar nomes dos leads separadamente
      let ligacoesComNomes: any[] = [];
      if (ligacoes && ligacoes.length > 0) {
        const leadIds = ligacoes.map(l => l.lead_id);
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, nome')
          .in('id', leadIds)
          .eq('user_id', user.id);

        console.log('👥 Leads encontrados:', leadsData);

        if (leadsError) {
          console.error('❌ Erro ao buscar leads:', leadsError);
        } else {
          ligacoesComNomes = ligacoes.map(ligacao => ({
            ...ligacao,
            nome_lead: leadsData?.find(lead => lead.id === ligacao.lead_id)?.nome || 'Lead não encontrado'
          }));
        }
      }

      console.log('📞 Ligações com nomes:', ligacoesComNomes);

      // Buscar mudanças de etapa recentes
      const { data: mudancas, error: mudancasError } = await supabase
        .from('leads')
        .select('id, nome, etapa, etapa_changed_at')
        .eq('user_id', user.id)
        .not('etapa_changed_at', 'is', null)
        .order('etapa_changed_at', { ascending: false })
        .limit(5);

      if (mudancasError) throw mudancasError;

      // Combinar e formatar atividades
      const atividadesFormatadas: Atividade[] = [];

      // Adicionar ligações
      ligacoesComNomes?.forEach((ligacao: any) => {
        atividadesFormatadas.push({
          id: `ligacao-${ligacao.id}`,
          tipo: 'ligacao',
          titulo: `Ligação via ${ligacao.tipo}`,
          descricao: `Contato realizado com ${ligacao.nome_lead}`,
          tempo: formatDistanceToNow(new Date(ligacao.data_ligacao), { 
            addSuffix: true, 
            locale: ptBR 
          }),
          nome_lead: ligacao.nome_lead,
          icon: ligacao.tipo === 'whatsapp' ? MessageSquare : Phone
        });
      });

      // Adicionar mudanças de etapa
      mudancas?.forEach((mudanca) => {
        atividadesFormatadas.push({
          id: `mudanca-${mudanca.id}`,
          tipo: 'mudanca_etapa',
          titulo: `Lead movido para ${mudanca.etapa}`,
          descricao: `${mudanca.nome} foi movido para a etapa ${mudanca.etapa}`,
          tempo: formatDistanceToNow(new Date(mudanca.etapa_changed_at), { 
            addSuffix: true, 
            locale: ptBR 
          }),
          nome_lead: mudanca.nome,
          icon: User
        });
      });

      // Ordenar por tempo (mais recente primeiro)
      atividadesFormatadas.sort((a, b) => {
        const timeA = a.id.startsWith('ligacao-') 
          ? ligacoes?.find(l => l.id === a.id.replace('ligacao-', ''))?.data_ligacao
          : mudancas?.find(m => m.id === a.id.replace('mudanca-', ''))?.etapa_changed_at;
        const timeB = b.id.startsWith('ligacao-')
          ? ligacoes?.find(l => l.id === b.id.replace('ligacao-', ''))?.data_ligacao
          : mudancas?.find(m => m.id === b.id.replace('mudanca-', ''))?.etapa_changed_at;
        
        return new Date(timeB || 0).getTime() - new Date(timeA || 0).getTime();
      });

      console.log('📊 Atividades formatadas:', atividadesFormatadas);
      
      setAtividades(atividadesFormatadas);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    buscarAtividades(true);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Suas últimas interações e movimentações no pipeline
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Carregando atividades...
              </div>
            ) : atividades.length > 0 ? (
              atividades.map((atividade) => (
                <div key={atividade.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10">
                      <atividade.icon className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{atividade.titulo}</p>
                      <Badge variant="outline" className="text-xs">
                        {atividade.tipo === 'ligacao' ? 'Ligação' : 'Movimento'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{atividade.descricao}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {atividade.tempo}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                Nenhuma atividade recente encontrada
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}