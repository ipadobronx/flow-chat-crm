import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Lead = Tables<"leads">;

export function SelecionadosCard() {
  const [selectedLeadsIds, setSelectedLeadsIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('sitplanSelecionados');
    if (stored) {
      setSelectedLeadsIds(JSON.parse(stored));
    }
  }, []);

  const { data: leads = [] } = useQuery({
    queryKey: ["sitplan-selecionados", selectedLeadsIds],
    queryFn: async () => {
      if (selectedLeadsIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("id", selectedLeadsIds);
      
      if (error) throw error;
      return data as Lead[];
    },
    enabled: selectedLeadsIds.length > 0,
  });

  const removeFromSelecionados = (leadId: string) => {
    const updated = selectedLeadsIds.filter(id => id !== leadId);
    setSelectedLeadsIds(updated);
    localStorage.setItem('sitplanSelecionados', JSON.stringify(updated));
    
    toast({
      title: "Lead removido",
      description: "Lead removido dos selecionados para SitPlan.",
    });
  };

  const clearAll = () => {
    setSelectedLeadsIds([]);
    localStorage.removeItem('sitplanSelecionados');
    
    toast({
      title: "Lista limpa",
      description: "Todos os leads foram removidos dos selecionados.",
    });
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case "Novo": return "bg-sky-500";
      case "OI": return "bg-indigo-500";
      case "PC": return "bg-orange-500";
      case "Delay PC": return "bg-red-500";
      case "Analisando Proposta": return "bg-orange-600";
      case "N": return "bg-purple-500";
      case "Apólice Emitida": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const calculateDaysInStage = (etapaChangedAt: string) => {
    if (!etapaChangedAt) return 0;
    const changeDate = new Date(etapaChangedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - changeDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📋 Selecionados para SitPlan
            {leads.length > 0 && (
              <Badge variant="secondary">{leads.length}</Badge>
            )}
          </CardTitle>
          {leads.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Limpar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lead selecionado para o próximo SitPlan</p>
            <p className="text-sm mt-2">Use o botão "✅ Sim" em "Incluir no SitPlan" no Pipeline para adicionar leads aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{lead.nome}</h4>
                    <Badge className={`text-white ${getEtapaColor(lead.etapa)}`}>
                      {lead.etapa}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {lead.empresa && (
                      <span>🏢 {lead.empresa}</span>
                    )}
                    {lead.telefone && (
                      <span>📱 {lead.telefone}</span>
                    )}
                    {lead.etapa === "Analisando Proposta" && lead.etapa_changed_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{calculateDaysInStage(lead.etapa_changed_at)} dias nesta etapa</span>
                      </div>
                    )}
                  </div>
                  
                  {lead.data_sitplan && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      📅 Data SitPlan: {new Date(lead.data_sitplan).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromSelecionados(lead.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}