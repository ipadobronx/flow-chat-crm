import { useEffect, useState } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type HistoricoEtapa = Tables<"historico_etapas_funil">;

interface LeadHistoryProps {
  leadId: string;
}

export function LeadHistory({ leadId }: LeadHistoryProps) {
  const [historico, setHistorico] = useState<HistoricoEtapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [leadId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("historico_etapas_funil")
        .select("*")
        .eq("lead_id", leadId)
        .order("data_mudanca", { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEtapaVariant = (etapa: string) => {
    switch (etapa) {
      case "Novo":
        return "secondary";
      case "Qualificado":
        return "default";
      case "Agendado":
        return "outline";
      case "Ligar Depois":
        return "secondary";
      case "TA":
        return "destructive";
      case "Não atendido":
        return "destructive";
      case "Marcar":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Histórico de Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Histórico de Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma mudança de etapa registrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Histórico de Etapas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {historico.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {item.etapa_anterior && (
                <Badge variant={getEtapaVariant(item.etapa_anterior)}>
                  {item.etapa_anterior}
                </Badge>
              )}
              
              {item.etapa_anterior && (
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              )}
              
              <Badge variant={getEtapaVariant(item.etapa_nova)}>
                {item.etapa_nova}
              </Badge>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {format(new Date(item.data_mudanca), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {item.observacoes && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.observacoes}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}