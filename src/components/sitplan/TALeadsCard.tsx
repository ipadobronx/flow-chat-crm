import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OutlineButton from "@/components/ui/outline-button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowUpDown, Users, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TAHierarchyConfig, HierarchyConfig } from "./TAHierarchyConfig";
import { updateLeadPartialSchema } from "@/lib/schemas";
import { sanitizeText } from "@/lib/validation";
import { globalRateLimiter } from "@/lib/validation";
import GlassProgressBar from "@/components/ui/glass-progress-bar";

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
    case "Não": return "bg-gray-500";
    case "Proposta Cancelada": return "bg-red-600";
    case "Persistência": return "bg-amber-600";
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
      className={`flex items-center justify-between p-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all ${
        isDragging ? "opacity-50 shadow-lg scale-95" : "hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h4 className="font-medium text-sm truncate text-white">{lead.nome}</h4>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge className={`text-white ${getEtapaColor(lead.etapa === 'TA' && lead.etapa_antes_ta ? lead.etapa_antes_ta : lead.etapa)}`}>
              {lead.etapa === 'TA' && lead.etapa_antes_ta ? lead.etapa_antes_ta : lead.etapa}
            </Badge>
            {lead.etapa === 'TA' && lead.etapa_antes_ta && (
              <Badge className="text-white bg-purple-600">
                TA
              </Badge>
            )}
            
            {lead.telefone && (
              <div className="flex items-center gap-1 text-white/70">
                <span className="truncate">{lead.telefone}</span>
              </div>
            )}
            
            {lead.recomendante && Array.isArray(lead.recomendante) && lead.recomendante.length > 0 && (
              <div className="flex items-center gap-1 text-white/70">
                <span className="truncate">{lead.recomendante.join(', ')}</span>
              </div>
            )}
            
            {lead.profissao && (
              <div className="flex items-center gap-1 text-white/70">
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
          className="text-white/70 hover:text-destructive hover:bg-white/10"
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
  
  // Estado para confirmação de limpar TA
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  
  // Estado para configuração de hierarquia avançada
  const [hierarchyConfig, setHierarchyConfig] = useState<HierarchyConfig>({
    enabledCategories: [],
    priorities: { profissoes: [], etapas: [] }
  });

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
      
      console.log(`✅ TALeadsCard: Encontrados ${data?.length || 0} leads para TA`);
      return data;
    },
    refetchInterval: 5000,
  });

  // Estado local para reordenação otimista com hierarquia avançada
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);

  // Extrair dados únicos para configuração de hierarquia
  const availableProfissoes = [...new Set(leads.map(lead => lead.profissao).filter(Boolean))] as string[];
    const availableEtapas = [...new Set(leads.map(lead => 
      (lead.etapa === 'TA' && lead.etapa_antes_ta) ? lead.etapa_antes_ta : lead.etapa
    ))].filter(Boolean) as string[];

  useEffect(() => {
    let sortedLeads = [...(leads ?? [])];
    
    // Aplicar hierarquia baseada na configuração avançada
    if (hierarchyConfig.enabledCategories.length > 0) {
      // Função para obter chave de agrupamento
  const getGroupingKey = (lead: Lead) => {
    const keys = hierarchyConfig.enabledCategories.map(category => {
      if (category === 'profissao') {
        return lead.profissao || 'Sem Profissão';
      } else {
        return (lead.etapa === 'TA' && lead.etapa_antes_ta) 
          ? lead.etapa_antes_ta 
          : lead.etapa;
      }
    });
    return keys.join(' | ');
  };

      // Agrupar leads
      const grouped = sortedLeads.reduce((acc, lead) => {
        const key = getGroupingKey(lead);
        if (!acc[key]) acc[key] = [];
        acc[key].push(lead);
        return acc;
      }, {} as Record<string, Lead[]>);

      // Ordenar grupos baseado nas prioridades configuradas
      const groupKeys = Object.keys(grouped).sort((a, b) => {
        // Separar as chaves compostas
        const aKeys = a.split(' | ');
        const bKeys = b.split(' | ');
        
        // Comparar categoria por categoria baseado na ordem configurada
        for (let i = 0; i < hierarchyConfig.enabledCategories.length; i++) {
          const category = hierarchyConfig.enabledCategories[i];
          const priorityList = category === 'profissao' 
            ? hierarchyConfig.priorities.profissoes 
            : hierarchyConfig.priorities.etapas;
          
          const aIndex = priorityList.indexOf(aKeys[i]);
          const bIndex = priorityList.indexOf(bKeys[i]);
          
          // Se ambos estão na lista de prioridades, usar essa ordem
          if (aIndex !== -1 && bIndex !== -1) {
            if (aIndex !== bIndex) return aIndex - bIndex;
          }
          // Se apenas um está na lista, ele vai primeiro
          else if (aIndex !== -1) return -1;
          else if (bIndex !== -1) return 1;
          // Se nenhum está na lista, ordem alfabética
          else {
            const comparison = aKeys[i].localeCompare(bKeys[i]);
            if (comparison !== 0) return comparison;
          }
        }
        return 0;
      });

      // Reconstruir lista ordenada
      sortedLeads = groupKeys.flatMap(groupKey => 
        grouped[groupKey].sort((a, b) => (a.ta_order ?? 0) - (b.ta_order ?? 0))
      );
    } else {
      // Sem hierarquia, ordem normal por ta_order
      sortedLeads.sort((a, b) => (a.ta_order ?? 0) - (b.ta_order ?? 0));
    }
    
    setLocalLeads(sortedLeads);
  }, [leads, hierarchyConfig]);

  // Configurar drop zone para aceitar leads arrastados
  const { setNodeRef, isOver } = useDroppable({
    id: "ta-leads",
    data: {
      type: "ta-leads",
      accepts: ["sitplan-lead"]
    }
  });

  // Remover lead do TA e mover para SitPlan
  const removeFromTA = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ 
          incluir_ta: false,
          incluir_sitplan: true,
          ta_order: null,
          ta_categoria_ativa: null,
          ta_categoria_valor: null
        })
        .eq("id", lead.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });

      toast({
        title: "Lead movido para SitPlan",
        description: `${lead.nome} foi movido para Selecionados para SitPlan.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover o lead para SitPlan.",
        variant: "destructive"
      });
    }
  };

  // Mover todos os leads para SitPlan
  const moveAllToSitPlan = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ 
          incluir_ta: false,
          incluir_sitplan: true,
          ta_order: null,
          ta_categoria_ativa: null,
          ta_categoria_valor: null
        })
        .eq("incluir_ta", true);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
      
      toast({
        title: "Leads movidos para SitPlan",
        description: "Todos os leads foram movidos de volta para o SitPlan.",
      });
    } catch (error) {
      console.error("Erro ao mover leads para SitPlan:", error);
      toast({
        title: "Erro",
        description: "Não foi possível mover os leads para o SitPlan.",
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
      className={`rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 min-h-[200px] ${
        isOver 
          ? 'ring-4 ring-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 scale-[1.02] shadow-2xl' 
          : 'hover:ring-2 hover:ring-purple-200 hover:shadow-lg'
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            Selecionados Sexta (TA)
            {localLeads.length > 0 && (
              <Badge variant="secondary">{localLeads.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Configuração Avançada de Hierarquia */}
            <TAHierarchyConfig
              config={hierarchyConfig}
              availableProfissoes={availableProfissoes}
              availableEtapas={availableEtapas}
              onConfigChange={setHierarchyConfig}
            />
            
            {/* Botão para limpar todos os leads do TA */}
            <OutlineButton
              onClick={() => setShowClearConfirmation(true)}
              className="h-8 w-8 p-0 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={localLeads.length === 0}
              aria-label="Limpar TA"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </OutlineButton>
            
            {/* Botão para ir para o menu TA - Verde Elétrico (sempre visível) */}
            <button 
              onClick={() => window.location.href = '/dashboard/ta'}
              className="bg-[#d4ff4a] text-black rounded-full p-2 hover:bg-[#c9f035] transition-colors"
              title="Ir para TA"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <div className="py-2">
            <GlassProgressBar progress={65} />
            <div className="mt-2 text-center text-sm text-muted-foreground">Carregando TA...</div>
          </div>
        )}
        {localLeads.length === 0 ? (
          <div className={`text-center py-6 transition-all duration-200 ${
            isOver 
              ? 'text-purple-600 bg-purple-50/50 rounded-lg border-2 border-dashed border-purple-300' 
              : 'text-muted-foreground'
          }`}>
            {isOver ? (
              <>
                <div className="text-base font-medium mb-1">Solte aqui para mover para TA</div>
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
                if (hierarchyConfig.enabledCategories.length === 0) {
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
                
                // Renderização com agrupamento por hierarquia avançada
            const grouped = localLeads.reduce((acc, lead) => {
              const keys = hierarchyConfig.enabledCategories.map(category => {
                if (category === 'profissao') {
                  return lead.profissao || 'Sem Profissão';
                } else {
                  return (lead.etapa === 'TA' && lead.etapa_antes_ta) 
                    ? lead.etapa_antes_ta 
                    : lead.etapa;
                }
              });
              const key = keys.join(' | ');
              if (!acc[key]) acc[key] = [];
              acc[key].push(lead);
              return acc;
            }, {} as Record<string, Lead[]>);
                
                return Object.entries(grouped).map(([groupKey, groupLeads]) => {
                  const keyParts = groupKey.split(' | ');
                  
                  return (
                    <div key={groupKey} className="space-y-3">
                      <div className="flex items-center gap-2 py-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          {hierarchyConfig.enabledCategories.map((category, index) => {
                            const value = keyParts[index];
                            const colorClass = category === 'etapa' ? getEtapaColor(value) : 'bg-purple-600';
                            
                            return (
                              <Badge key={category} className={`text-white ${colorClass}`}>
                                {value}
                              </Badge>
                            );
                          })}
                        </div>
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
      
      {/* Dialog de confirmação para limpar TA */}
      <AlertDialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
        <AlertDialogContent className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-inter font-normal tracking-tighter text-lg sm:text-xl text-white">
              Limpar todos os leads do TA?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta ação irá remover todos os leads da lista do TA. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAllTA}
              className="rounded-xl bg-destructive/80 text-white hover:bg-destructive"
            >
              Apagar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}