import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface AgendamentoLigacao {
  id: string;
  data_agendamento: string;
  observacoes: string | null;
  status: string;
  leads: {
    id: string;
    nome: string;
    telefone: string | null;
  };
}

export function LigacoesHoje() {
  const { user } = useAuth();
  const [ligacoes, setLigacoes] = useState<AgendamentoLigacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLigacoesHoje = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Buscar agendamentos de hoje
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

      const { data, error } = await supabase
        .from('agendamentos_ligacoes')
        .select(`
          id,
          data_agendamento,
          observacoes,
          status,
          lead_id
        `)
        .eq('user_id', user.id)
        .gte('data_agendamento', inicioHoje.toISOString())
        .lte('data_agendamento', fimHoje.toISOString())
        .order('data_agendamento', { ascending: true });

      if (error) throw error;

      // Buscar os dados dos leads separadamente
      const agendamentosComLeads = await Promise.all(
        (data || []).map(async (agendamento) => {
          const { data: leadData } = await supabase
            .from('leads')
            .select('id, nome, telefone')
            .eq('id', agendamento.lead_id)
            .single();

          return {
            ...agendamento,
            leads: leadData || { id: '', nome: 'Lead não encontrado', telefone: null }
          };
        })
      );

      setLigacoes(agendamentosComLeads || []);
    } catch (error) {
      console.error('Erro ao buscar ligações de hoje:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ligações de hoje",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLigacoesHoje();
  }, [user]);

  const marcarComoConcluida = async (agendamentoId: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos_ligacoes')
        .update({ status: 'concluida' })
        .eq('id', agendamentoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ligação marcada como concluída",
      });

      fetchLigacoesHoje();
    } catch (error) {
      console.error('Erro ao marcar ligação como concluída:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar ligação como concluída",
        variant: "destructive",
      });
    }
  };

  const cancelarLigacao = async (agendamentoId: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos_ligacoes')
        .update({ status: 'cancelada' })
        .eq('id', agendamentoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ligação cancelada",
      });

      fetchLigacoesHoje();
    } catch (error) {
      console.error('Erro ao cancelar ligação:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar ligação",
        variant: "destructive",
      });
    }
  };

  const handleTelefonar = (telefone: string | null) => {
    if (!telefone) {
      toast({
        title: "Erro",
        description: "Número de telefone não encontrado",
        variant: "destructive",
      });
      return;
    }
    
    const numeroLimpo = telefone.replace(/\D/g, '');
    window.open(`tel:${numeroLimpo}`);
  };

  const handleWhatsApp = (telefone: string | null) => {
    if (!telefone) {
      toast({
        title: "Erro",
        description: "Número de telefone não encontrado",
        variant: "destructive",
      });
      return;
    }
    
    const numeroLimpo = telefone.replace(/\D/g, '');
    const numeroFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
    window.open(`https://wa.me/${numeroFormatado}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline">Pendente</Badge>;
      case 'concluida':
        return <Badge variant="default">Concluída</Badge>;
      case 'cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ligações de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const ligacoesPendentes = ligacoes.filter(l => l.status === 'pendente');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Ligações de Hoje ({ligacoesPendentes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ligacoes.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma ligação agendada para hoje</p>
        ) : (
          <div className="space-y-3">
            {ligacoes.map((ligacao) => (
              <div
                key={ligacao.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{ligacao.leads.nome}</span>
                    {getStatusBadge(ligacao.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(parseISO(ligacao.data_agendamento), "HH:mm", { locale: ptBR })}
                    {ligacao.observacoes && (
                      <span className="ml-2">• {ligacao.observacoes}</span>
                    )}
                  </div>
                </div>
                
                {ligacao.status === 'pendente' && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTelefonar(ligacao.leads.telefone)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhatsApp(ligacao.leads.telefone)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => marcarComoConcluida(ligacao.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelarLigacao(ligacao.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}