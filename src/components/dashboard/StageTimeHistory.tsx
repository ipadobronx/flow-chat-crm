import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StageTimeRecord {
  id: string;
  lead_id: string;
  etapa: string;
  data_entrada: string;
  data_saida: string | null;
  dias_na_etapa: number | null;
  lead_nome?: string;
}

interface StageTimeHistoryProps {
  leadId?: string;
  showLeadName?: boolean;
  limit?: number;
}

export function StageTimeHistory({ leadId, showLeadName = true, limit = 10 }: StageTimeHistoryProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<StageTimeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStageTimeHistory() {
      if (!user) return;

      try {
        let query = supabase
          .from("tempo_etapas_historico")
          .select(`
            id,
            lead_id,
            etapa,
            data_entrada,
            data_saida,
            dias_na_etapa
          `)
          .eq("user_id", user.id)
          .order("data_entrada", { ascending: false })
          .limit(limit);

        if (leadId) {
          query = query.eq("lead_id", leadId);
        }

        const { data: tempoData, error } = await query;

        if (error) throw error;

        // Buscar nomes dos leads separadamente se necessário
        const formattedData = await Promise.all(
          (tempoData || []).map(async (record) => {
            if (showLeadName) {
              const { data: leadData } = await supabase
                .from("leads")
                .select("nome")
                .eq("id", record.lead_id)
                .eq("user_id", user.id)
                .single();
              
              return {
                ...record,
                lead_nome: leadData?.nome || "Lead não encontrado"
              };
            }
            return record;
          })
        );

        setRecords(formattedData);
      } catch (error) {
        console.error("Erro ao buscar histórico de tempo em etapas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStageTimeHistory();
  }, [user, leadId, limit]);

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case "Novo": return "bg-blue-500";
      case "OI": return "bg-green-500";
      case "PC": return "bg-yellow-500";
      case "Delay PC": return "bg-red-500";
      case "Analisando Proposta": return "bg-orange-600";
      case "N": return "bg-red-500";
      case "Proposta Não Apresentada": return "bg-gray-600";
      case "Pendência de UW": return "bg-yellow-700";
      case "Apólice Emitida": return "bg-purple-500";
      case "Apólice Entregue": return "bg-green-600";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl">
        <CardHeader>
          <CardTitle className="font-inter font-normal tracking-tighter">Histórico de Tempo em Etapas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-2">
            <GlassProgressBar progress={60} />
            <div className="mt-2 text-center text-sm text-black">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl">
      <CardHeader>
        <CardTitle className="font-inter font-normal tracking-tighter">
          Histórico de Tempo em Etapas
          {records.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {records.length} registros
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-black">
            Nenhum histórico de tempo encontrado.
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 rounded-2xl border border-border/20 bg-white/30 dark:bg-white/10 backdrop-blur-md">
                <div className="flex-1">
                  {showLeadName && (
                    <div className="font-medium text-sm mb-1">{record.lead_nome}</div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge className={`text-white ${getEtapaColor(record.etapa)}`}>
                      {record.etapa}
                    </Badge>
                    {record.dias_na_etapa && (
                      <Badge variant="outline">
                        {record.dias_na_etapa} dia{record.dias_na_etapa !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-black mt-1">
                    Entrada: {formatDistanceToNow(new Date(record.data_entrada), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                    {record.data_saida && (
                      <span className="ml-2">
                        • Saída: {formatDistanceToNow(new Date(record.data_saida), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import GlassProgressBar from "@/components/ui/glass-progress-bar";