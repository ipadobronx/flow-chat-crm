import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Lead = Tables<"leads">;

export function SelecionadosCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [], refetch } = useQuery({
    queryKey: ["sitplan-selecionados"],
    queryFn: async () => {
      console.log('🔄 Buscando leads selecionados para SitPlan...');
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("incluir_sitplan", true);
      
      if (error) throw error;
      console.log(`✅ SitPlan encontrou ${data?.length || 0} leads selecionados:`, 
        data?.map(lead => ({ id: lead.id, nome: lead.nome, incluir_sitplan: lead.incluir_sitplan }))
      );
      return data as Lead[];
    },
  });

  // Configurar realtime para sincronização automática
  useEffect(() => {
    const channel = supabase
      .channel('sitplan-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('🔴 SitPlan detectou mudança na tabela leads:', payload);
          // Invalidar e refetch quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const removeFromSelecionados = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ incluir_sitplan: false })
        .eq("id", leadId);

      if (error) throw error;

      await refetch();
      
      toast({
        title: "Lead removido",
        description: "Lead removido dos selecionados para SitPlan.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o lead.",
        variant: "destructive"
      });
    }
  };

  const clearAll = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ incluir_sitplan: false })
        .in("id", leads.map(lead => lead.id));

      if (error) throw error;

      await refetch();
      
      toast({
        title: "Lista limpa",
        description: "Todos os leads foram removidos dos selecionados.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar a lista.",
        variant: "destructive"
      });
    }
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
                
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        // Remove from SitPlan
                        await removeFromSelecionados(lead.id);
                        
                        // Add to TA
                        const currentTA = JSON.parse(localStorage.getItem('selectedLeadsForTA') || '[]');
                        if (!currentTA.includes(lead.id)) {
                          const newTA = [...currentTA, lead.id];
                          localStorage.setItem('selectedLeadsForTA', JSON.stringify(newTA));
                        }
                        
                        toast({
                          title: "Lead movido para TA!",
                          description: `${lead.nome} foi movido para os Leads Selecionados para TA.`,
                        });
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Não foi possível mover o lead para TA.",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="text-xs px-2 py-1 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                    title="Mover para TA"
                  >
                    TA
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromSelecionados(lead.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Remover do SitPlan"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}