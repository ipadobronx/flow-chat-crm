import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { GripVertical, Settings, ArrowUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Lead = Tables<"leads">;

const DEFAULT_ETAPAS_ORDER = ["Novo", "OI", "PC", "Delay PC", "Analisando Proposta", "Proposta Não Apresentada", "N", "Pendência de UW", "Apólice Emitida", "Placed", "Apólice Entregue"];

export function TALeadsCard() {
  const [etapasOrder, setEtapasOrder] = useState<string[]>(DEFAULT_ETAPAS_ORDER);
  const [showEtapasConfig, setShowEtapasConfig] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [], refetch } = useQuery({
    queryKey: ["ta-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("incluir_ta", true)
        .order("ta_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Configurar realtime para sincronização automática
  useEffect(() => {
    const channel = supabase
      .channel('ta-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('🔴 TA detectou mudança na tabela leads:', payload);
          queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(etapasOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEtapasOrder(items);
  };

  const moveLeadUp = async (leadId: string, currentOrder: number) => {
    if (currentOrder <= 1) return; // Already at the top

    try {
      // Get the lead that's currently above this one
      const leadAbove = leads.find(lead => lead.ta_order === currentOrder - 1);
      
      if (leadAbove) {
        // Swap orders
        await supabase
          .from("leads")
          .update({ ta_order: currentOrder })
          .eq("id", leadAbove.id);
        
        await supabase
          .from("leads")
          .update({ ta_order: currentOrder - 1 })
          .eq("id", leadId);
      }

      await refetch();
      
      toast({
        title: "Lead movido para cima",
        description: "A ordem do lead foi atualizada.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover o lead.",
        variant: "destructive"
      });
    }
  };

  const removeFromTA = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ incluir_ta: false, ta_order: 0 })
        .eq("id", leadId);

      if (error) throw error;

      await refetch();
      
      toast({
        title: "Lead removido",
        description: "Lead removido da lista do TA.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o lead.",
        variant: "destructive"
      });
    }
  };

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
      case "Placed": return "bg-emerald-600";
      case "Apólice Entregue": return "bg-green-600";
      default: return "bg-gray-500";
    }
  };

  const groupedLeads = leads.reduce((acc, lead) => {
    if (!acc[lead.etapa]) {
      acc[lead.etapa] = [];
    }
    acc[lead.etapa].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);

  const clearSelectedLeads = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ incluir_ta: false, ta_order: 0 })
        .in("id", leads.map(lead => lead.id));

      if (error) throw error;

      await refetch();
      
      toast({
        title: "Lista limpa",
        description: "Todos os leads foram removidos do TA.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar a lista.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            Leads TA
            {leads.length > 0 && (
              <Badge variant="secondary">{leads.length}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEtapasConfig(!showEtapasConfig)}
              className="text-xs px-2 py-1 h-7"
            >
              <Settings className="w-3 h-3" />
            </Button>
            {leads.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={clearSelectedLeads}
                className="text-xs px-2 py-1 h-7"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {showEtapasConfig && (
          <Card className="p-3">
            <h4 className="font-medium mb-2 text-sm">Ordem das Etapas</h4>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="etapas">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                    {etapasOrder.map((etapa, index) => (
                      <Draggable key={etapa} draggableId={etapa} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-2 p-2 bg-background border rounded-md"
                          >
                            <GripVertical className="w-3 h-3 text-muted-foreground" />
                            <Badge className={`text-white text-xs ${getEtapaColor(etapa)}`}>
                              {etapa}
                            </Badge>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Card>
        )}

        {leads.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="text-sm">Nenhum lead selecionado para TA</div>
            <div className="text-xs mt-1">Use o botão "TA" para adicionar leads</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {leads.map((lead) => (
              <Card key={lead.id} className="p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <h4 className="font-medium text-sm truncate">{lead.nome}</h4>
                      <Badge className={`text-white text-xs ${getEtapaColor(lead.etapa)}`}>
                        {lead.etapa}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.telefone || "Sem telefone"}
                    </p>
                    {lead.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {lead.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveLeadUp(lead.id, lead.ta_order)}
                      disabled={lead.ta_order <= 1}
                      className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-700"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromTA(lead.id)}
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-700"
                      title="Remover do TA"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}