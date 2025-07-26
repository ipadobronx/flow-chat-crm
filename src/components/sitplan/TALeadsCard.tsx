import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlareCard } from "@/components/ui/glare-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { GripVertical, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

const DEFAULT_ETAPAS_ORDER = ["Novo", "OI", "PC", "Delay PC", "Analisando Proposta", "Proposta Não Apresentada", "N", "Pendência de UW", "Apólice Emitida", "Placed", "Apólice Entregue"];

export function TALeadsCard() {
  const [selectedLeadsIds, setSelectedLeadsIds] = useState<string[]>([]);
  const [etapasOrder, setEtapasOrder] = useState<string[]>(DEFAULT_ETAPAS_ORDER);
  const [showEtapasConfig, setShowEtapasConfig] = useState(false);

  // Load selected leads from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('selectedLeadsForTA');
    if (stored) {
      setSelectedLeadsIds(JSON.parse(stored));
    }

    const storedOrder = localStorage.getItem('taEtapasOrder');
    if (storedOrder) {
      setEtapasOrder(JSON.parse(storedOrder));
    }
  }, []);

  const { data: leads = [] } = useQuery({
    queryKey: ["ta-leads", selectedLeadsIds],
    queryFn: async () => {
      if (selectedLeadsIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("id", selectedLeadsIds);
      
      if (error) throw error;
      return data;
    },
    enabled: selectedLeadsIds.length > 0,
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(etapasOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEtapasOrder(items);
    localStorage.setItem('taEtapasOrder', JSON.stringify(items));
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

  const clearSelectedLeads = () => {
    setSelectedLeadsIds([]);
    localStorage.removeItem('selectedLeadsForTA');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Leads Selecionados para TA
            {leads.length > 0 && (
              <Badge variant="secondary">{leads.length} leads</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEtapasConfig(!showEtapasConfig)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurar Etapas
            </Button>
            {leads.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={clearSelectedLeads}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showEtapasConfig && (
          <Card className="p-4">
            <h4 className="font-medium mb-3">Ordem das Etapas</h4>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="etapas">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {etapasOrder.map((etapa, index) => (
                      <Draggable key={etapa} draggableId={etapa} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-2 p-2 bg-background border rounded-md"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <Badge className={`text-white ${getEtapaColor(etapa)}`}>
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
          <div className="text-center py-8 text-muted-foreground">
            Nenhum lead selecionado para TA.
            <br />
            Use o botão "Editar" na tabela acima para selecionar leads.
          </div>
        ) : (
          <div className="grid gap-4">
            {etapasOrder.map((etapa) => {
              const etapaLeads = groupedLeads[etapa] || [];
              if (etapaLeads.length === 0) return null;

              return (
                <div key={etapa} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-white ${getEtapaColor(etapa)}`}>
                      {etapa}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {etapaLeads.length} lead(s)
                    </span>
                  </div>
                  <div className="grid gap-2 ml-4">
                    {etapaLeads.map((lead) => (
                      <Card key={lead.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{lead.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {lead.telefone || "Sem telefone"}
                            </p>
                            {lead.observacoes && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {lead.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}