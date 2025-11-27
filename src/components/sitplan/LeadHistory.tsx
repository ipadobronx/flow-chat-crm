import { useEffect, useState } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsTablet } from "@/hooks/use-tablet";

type HistoricoEtapa = Tables<"historico_etapas_funil">;

interface LeadHistoryProps {
  leadId: string;
}

export function LeadHistory({ leadId }: LeadHistoryProps) {
  const [historico, setHistorico] = useState<HistoricoEtapa[]>([]);
  const [loading, setLoading] = useState(true);
  const isTablet = useIsTablet();

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

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case "Todos": return "bg-blue-500";
      case "Novo": return "bg-sky-500";
      case "TA": return "bg-purple-600";
      case "Não atendido": return "bg-red-600";
      case "Ligar Depois": return "bg-yellow-600";
      case "Marcar": return "bg-green-600";
      case "OI": return "bg-indigo-500";
      case "Delay OI": return "bg-yellow-500";
      case "PC": return "bg-orange-500";
      case "Delay PC": return "bg-red-500";
      case "Analisando Proposta": return "bg-orange-600";
      case "N": return "bg-purple-500";
      case "Proposta Não Apresentada": return "bg-gray-600";
      case "Pendência de UW": return "bg-yellow-700";
      case "Apólice Emitida": return "bg-green-500";
      case "Apólice Entregue": return "bg-emerald-500";
      case "Delay C2": return "bg-cyan-500";
      case "Não": return "bg-gray-500";
      case "Proposta Cancelada": return "bg-red-600";
      case "Apólice Cancelada": return "bg-red-700";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 font-inter font-normal tracking-tighter ${isTablet ? 'text-white' : ''}`}>
            <Clock className="w-4 h-4" />
            Histórico de Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={isTablet ? 'text-white' : 'text-black'}>Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (historico.length === 0) {
    return (
      <Card className="rounded-3xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 font-inter font-normal tracking-tighter ${isTablet ? 'text-white' : ''}`}>
            <Clock className="w-4 h-4" />
            Histórico de Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={isTablet ? 'text-white' : 'text-black'}>Nenhuma mudança de etapa registrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl">
      <CardHeader>
          <CardTitle className={`flex items-center gap-2 font-inter font-normal tracking-tighter ${isTablet ? 'text-white' : ''}`}>
            <Clock className="w-4 h-4" />
            Histórico de Etapas
          </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {historico.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl border border-border/20 bg-white/30 dark:bg-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {item.etapa_anterior && (
                <Badge className={`text-white text-xs ${getEtapaColor(item.etapa_anterior)}`}>
                  {item.etapa_anterior}
                </Badge>
              )}
              
              {item.etapa_anterior && (
                <ArrowRight className={`w-4 h-4 ${isTablet ? 'text-white' : 'text-black'}`} />
              )}
              
              <Badge className={`text-white text-xs ${getEtapaColor(item.etapa_nova)}`}>
                {item.etapa_nova}
              </Badge>
            </div>
            
            <div className="text-right">
              <p className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>
                {format(new Date(item.data_mudanca), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {item.observacoes && (
                <p className={`text-xs mt-1 ${isTablet ? 'text-white/70' : 'text-black'}`}>
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