import { useState, useEffect } from "react";
import { Clock, MessageSquare, Calendar, DollarSign, User, Phone, Cake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

interface Aniversariante {
  id: string;
  nome: string;
  data_nascimento: string;
  telefone?: string;
}

export function ActivityFeed() {
  const { user } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      buscarAtividades();
      buscarAniversariantes();
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

  const buscarAtividades = async () => {
    if (!user) return;

    console.log('🔍 Buscando atividades para o usuário:', user.id);

    try {
      // Buscar ligações recentes sem JOIN primeiro para debugar
      const { data: ligacoes, error: ligacoesError } = await supabase
        .from('ligacoes_historico')
        .select('*')
        .eq('user_id', user.id)
        .order('data_ligacao', { ascending: false })
        .limit(10);

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
      
      setAtividades(atividadesFormatadas.slice(0, 8));
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarAniversariantes = async () => {
    if (!user) return;

    try {
      const hoje = new Date();
      const diaHoje = hoje.getDate();
      const mesHoje = hoje.getMonth() + 1;

      const { data, error } = await supabase
        .from('leads')
        .select('id, nome, data_nascimento, telefone')
        .eq('user_id', user.id)
        .not('data_nascimento', 'is', null);

      if (error) throw error;

      // Filtrar aniversariantes do dia
      const aniversariantesHoje = data?.filter(lead => {
        if (!lead.data_nascimento) return false;
        const dataNasc = new Date(lead.data_nascimento);
        return dataNasc.getDate() === diaHoje && dataNasc.getMonth() + 1 === mesHoje;
      }) || [];

      setAniversariantes(aniversariantesHoje);
    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error);
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Aniversariantes do Dia */}
      {aniversariantes.length > 0 && (
        <Card className="animate-fade-in border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Cake className="w-4 h-4" />
              Aniversariantes do Dia
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Lembre-se de parabenizar seus contatos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aniversariantes.map((aniversariante) => (
                <div key={aniversariante.id} className="flex items-center justify-between p-3 rounded-lg bg-white/80 border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8 border-2 border-yellow-300">
                      <AvatarFallback className="bg-yellow-100 text-yellow-800">
                        {getInitials(aniversariante.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-yellow-900">{aniversariante.nome}</p>
                      <p className="text-xs text-yellow-700">🎂 Aniversário hoje!</p>
                    </div>
                  </div>
                  {aniversariante.telefone && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const phoneNumber = aniversariante.telefone?.replace(/\D/g, '');
                          window.open(`https://wa.me/55${phoneNumber}?text=🎉 Parabéns pelo seu aniversário! 🎂`, '_blank');
                        }}
                        className="p-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => window.open(`tel:${aniversariante.telefone}`, '_self')}
                        className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Atividades Recentes */}
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
            <button
              onClick={buscarAtividades}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-4">
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
              <div className="text-center text-sm text-muted-foreground py-4">
                Nenhuma atividade recente encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}