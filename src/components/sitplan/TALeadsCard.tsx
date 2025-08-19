import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowUpDown, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Lead = Tables<"leads">;

const DEFAULT_ETAPAS_ORDER = ["Novo", "OI", "PC", "Delay PC", "Analisando Proposta", "Proposta Não Apresentada", "N", "Pendência de UW", "Apólice Emitida", "Apólice Entregue"];

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

// Componente para item arrastável do TA
function TAItem({ lead, onRemove, isHierarchyMode = false }: { 
  lead: Lead; 
  onRemove: (lead: Lead) => void;
  isHierarchyMode?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "ta-item",
      lead: lead,
      containerEtapa: lead.etapa,
      listId: isHierarchyMode ? `group:${lead.ta_categoria_valor || lead.etapa}` : "main"
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/30 transition-all ${
        isDragging ? "opacity-50 shadow-lg scale-95" : "hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h4 className="font-medium text-sm truncate">{lead.nome}</h4>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge className={`text-white ${getEtapaColor(lead.etapa)}`}>
              {lead.etapa}
            </Badge>
            
            {lead.telefone && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>📱</span>
                <span className="truncate">{lead.telefone}</span>
              </div>
            )}
            
            {lead.recomendante && Array.isArray(lead.recomendante) && lead.recomendante.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>👥</span>
                <span className="truncate">{lead.recomendante.join(', ')}</span>
              </div>
            )}
            
            {lead.profissao && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>💼</span>
                <span className="truncate">{lead.profissao}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(lead)}
          className="text-muted-foreground hover:text-destructive"
          title="Remover do TA"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function TALeadsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para hierarquia TA
  const [hierarchySort, setHierarchySort] = useState<'profissao' | 'etapa' | 'none'>('none');
  const [hierarchyOrder, setHierarchyOrder] = useState<string[]>([]);

  // Buscar leads que estão marcados para TA
  const { data: leads = [], refetch, isLoading, error } = useQuery({
    queryKey: ["ta-leads"],
    queryFn: async () => {
      console.log('🔍 TALeadsCard: Buscando leads para TA...');
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("incluir_ta", true)
        .order("ta_order", { ascending: true })
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error('❌ TALeadsCard: Erro na query:', error);
        throw error;
      }
      
      console.log(`✅ TALeadsCard: Encontrados ${data?.length || 0} leads para TA:`, 
        data?.map(lead => ({ 
          id: lead.id, 
          nome: lead.nome, 
          incluir_ta: lead.incluir_ta, 
          ta_order: lead.ta_order,
          ta_categoria_ativa: lead.ta_categoria_ativa,
          ta_categoria_valor: lead.ta_categoria_valor
        }))
      );
      
      // Detectar hierarquia automaticamente baseada nos dados
      if (data && data.length > 0) {
        const hasCategoria = data.some(lead => lead.ta_categoria_ativa);
        if (hasCategoria) {
          const categoriaAtiva = data[0]?.ta_categoria_ativa;
          if (categoriaAtiva && categoriaAtiva !== hierarchySort) {
            setHierarchySort(categoriaAtiva as 'profissao' | 'etapa');
          }
        }
      }
      
      return data;
    },
    refetchInterval: 5000,
  });

  // Estado local para reordenação otimista com hierarquia
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);

  useEffect(() => {
    let sortedLeads = [...(leads ?? [])];
    
    // Aplicar hierarquia de ordenação
    if (hierarchySort === 'profissao') {
      // Agrupar por profissão e ordenar grupos
      const grouped = sortedLeads.reduce((acc, lead) => {
        const profissao = lead.profissao || 'Sem Profissão';
        if (!acc[profissao]) acc[profissao] = [];
        acc[profissao].push(lead);
        return acc;
      }, {} as Record<string, Lead[]>);
      
      // Se há ordem personalizada, usar ela; senão, ordem alfabética
      const profissoes = hierarchyOrder.length > 0 
        ? hierarchyOrder.filter(p => grouped[p]) 
        : Object.keys(grouped).sort();
      
      // Adicionar profissões não listadas na ordem personalizada ao final
      if (hierarchyOrder.length > 0) {
        Object.keys(grouped).forEach(p => {
          if (!hierarchyOrder.includes(p)) profissoes.push(p);
        });
      }
      
      sortedLeads = profissoes.flatMap(profissao => 
        grouped[profissao].sort((a, b) => (a.ta_order ?? 0) - (b.ta_order ?? 0))
      );
      
    } else if (hierarchySort === 'etapa') {
      // Agrupar por etapa e ordenar grupos
      const grouped = sortedLeads.reduce((acc, lead) => {
        const etapa = lead.etapa;
        if (!acc[etapa]) acc[etapa] = [];
        acc[etapa].push(lead);
        return acc;
      }, {} as Record<string, Lead[]>);
      
      // Usar ordem das etapas ou alfabética
      const etapas = hierarchyOrder.length > 0 
        ? hierarchyOrder.filter(e => grouped[e]) 
        : Object.keys(grouped).sort();
      
      if (hierarchyOrder.length > 0) {
        Object.keys(grouped).forEach(e => {
          if (!hierarchyOrder.includes(e)) etapas.push(e);
        });
      }
      
      sortedLeads = etapas.flatMap(etapa => 
        grouped[etapa].sort((a, b) => (a.ta_order ?? 0) - (b.ta_order ?? 0))
      );
      
    } else {
      // Sem hierarquia, ordem normal por ta_order
      sortedLeads.sort((a, b) => (a.ta_order ?? 0) - (b.ta_order ?? 0));
    }
    
    setLocalLeads(sortedLeads);
  }, [leads, hierarchySort, hierarchyOrder]);

  // Configurar drop zone para aceitar leads arrastados
  const { setNodeRef, isOver } = useDroppable({
    id: "ta-leads",
    data: {
      type: "ta-leads",
      accepts: ["sitplan-lead"]
    }
  });

  // Remover lead do TA
  const removeFromTA = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ 
          incluir_ta: false,
          ta_order: null,
          ta_categoria_ativa: null,
          ta_categoria_valor: null
        })
        .eq("id", lead.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });

      toast({
        title: "Lead removido do TA",
        description: `${lead.nome} foi removido do TA.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o lead do TA.",
        variant: "destructive"
      });
    }
  };

  // Limpar todos os leads do TA
  const clearAllTA = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ 
          incluir_ta: false,
          ta_order: null,
          ta_categoria_ativa: null,
          ta_categoria_valor: null
        })
        .eq("incluir_ta", true);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
      
      toast({
        title: "Leads removidos do TA",
        description: "Todos os leads foram removidos do TA.",
      });
    } catch (error) {
      console.error("Erro ao remover leads do TA:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover os leads do TA.",
        variant: "destructive"
      });
    }
  };

  // Monitorar eventos de DnD para reordenação
  useDndMonitor({
    async onDragEnd(event) {
      const { active, over } = event;
      if (!active || !over) return;

      const activeData = active.data.current as any;
      const overData = over.data.current as any;

      if (activeData?.type !== "ta-item" || overData?.type !== "ta-item") return;

      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId) return;

      const oldIndex = localLeads.findIndex(l => l.id === activeId);
      const newIndex = localLeads.findIndex(l => l.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reordenar leads
      const reordered = [...localLeads];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Atualização otimista
      setLocalLeads(reordered);

      try {
        // Persistir no banco
        const baseOrder = Math.floor(Date.now() / 1000);
        const updates = reordered.map((lead, idx) => 
          supabase
            .from("leads")
            .update({ ta_order: baseOrder + idx })
            .eq("id", lead.id)
        );

        const results = await Promise.all(updates);
        const hasError = results.some(r => (r as any).error);
        
        if (hasError) throw new Error("Erro ao atualizar ordem");

        await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      } catch (error) {
        console.error("Erro ao reordenar TA:", error);
        // Reverter estado local em caso de erro
        setLocalLeads(leads);
        toast({
          title: "Erro ao reordenar",
          description: "Não foi possível salvar a nova ordem.",
          variant: "destructive",
        });
      }
    }
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`transition-all duration-300 min-h-[200px] ${
        isOver 
          ? 'ring-4 ring-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 scale-[1.02] shadow-2xl' 
          : 'hover:ring-2 hover:ring-purple-200 hover:shadow-lg'
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📅 Selecionados Sexta (TA)
            {localLeads.length > 0 && (
              <Badge variant="secondary">{localLeads.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Controle de Hierarquia */}
            <Select 
              value={hierarchySort} 
              onValueChange={(value: 'profissao' | 'etapa' | 'none') => setHierarchySort(value)}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem Hierarquia</SelectItem>
                <SelectItem value="profissao">Por Profissão</SelectItem>
                <SelectItem value="etapa">Por Etapa</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Botão para limpar todos os leads do TA */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllTA}
              className="h-8 text-xs"
              disabled={localLeads.length === 0}
            >
              Limpar TA
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {localLeads.length === 0 ? (
          <div className={`text-center py-6 transition-all duration-200 ${
            isOver 
              ? 'text-purple-600 bg-purple-50/50 rounded-lg border-2 border-dashed border-purple-300' 
              : 'text-muted-foreground'
          }`}>
            {isOver ? (
              <>
                <div className="text-base font-medium mb-1">🎯 Solte aqui para mover para TA</div>
                <div className="text-sm">Arraste leads do SitPlan para esta área</div>
              </>
            ) : (
              <>
                Nenhum lead selecionado para TA.
                <br />
                <span className="text-sm">Arraste leads do SitPlan para esta área.</span>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <SortableContext
              items={localLeads.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {(() => {
                if (hierarchySort === 'none') {
                  // Renderização simples sem agrupamento
                  return localLeads.map((lead) => (
                    <TAItem 
                      key={lead.id} 
                      lead={lead} 
                      onRemove={removeFromTA} 
                      isHierarchyMode={false}
                    />
                  ));
                }
                
                // Renderização com agrupamento por hierarquia
                const grouped = localLeads.reduce((acc, lead) => {
                  const key = hierarchySort === 'profissao' 
                    ? lead.profissao || 'Sem Profissão' 
                    : lead.etapa;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(lead);
                  return acc;
                }, {} as Record<string, Lead[]>);
                
                const groupKeys = hierarchyOrder.length > 0 
                  ? hierarchyOrder.filter(k => grouped[k])
                  : Object.keys(grouped).sort();
                
                // Adicionar grupos não listados na ordem personalizada
                if (hierarchyOrder.length > 0) {
                  Object.keys(grouped).forEach(k => {
                    if (!hierarchyOrder.includes(k)) groupKeys.push(k);
                  });
                }
                
                return groupKeys.map((groupKey) => {
                  const groupLeads = grouped[groupKey] || [];
                  
                  return (
                    <div key={groupKey} className="space-y-3">
                      <div className="flex items-center gap-2 py-2 border-b border-border/50">
                        <Badge className={`text-white transition-all duration-200 ${
                          hierarchySort === 'etapa' ? getEtapaColor(groupKey) : 'bg-purple-600'
                        }`}>
                          {hierarchySort === 'profissao' ? '💼' : '🏷️'} {groupKey}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {groupLeads.length} lead(s)
                        </span>
                      </div>
                      <div className="ml-4 space-y-3">
                        {groupLeads.map((lead) => (
                          <TAItem 
                            key={lead.id} 
                            lead={lead} 
                            onRemove={removeFromTA} 
                            isHierarchyMode={true}
                          />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </SortableContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
}