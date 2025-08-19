import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useDroppable, useDndMonitor } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { X, ArrowUp, ArrowDown, Filter, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type TAItemProps = {
  lead: Lead;
  etapa: string;
  listId: string;
  onRemove: (lead: Lead) => Promise<void>;
};

function TAItem({ lead, etapa, listId, onRemove }: TAItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: {
      type: "ta-item",
      containerEtapa: etapa,
      listId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 150ms ease",
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/30 transition-all duration-150 ${
        isDragging ? "opacity-70 shadow-md scale-[0.98]" : "hover:shadow-sm"
      }`}
   >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h4 className="font-semibold text-base truncate">
              {lead.nome}
            </h4>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <Badge className={`text-white text-xs px-2 py-1 flex-shrink-0 ${getEtapaColor(lead.etapa)}`}>
              {lead.etapa}
            </Badge>
            {lead.telefone && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-xs">📱</span>
                <span className="truncate">{lead.telefone}</span>
              </div>
            )}
            {lead.recomendante && Array.isArray(lead.recomendante) && lead.recomendante.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-xs">👥</span>
                <span className="truncate">{lead.recomendante.join(', ')}</span>
              </div>
            )}
            {lead.profissao && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-xs">💼</span>
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
        data?.map(lead => ({ id: lead.id, nome: lead.nome, incluir_ta: lead.incluir_ta, ta_order: lead.ta_order }))
      );
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
        if (!acc[lead.etapa]) acc[lead.etapa] = [];
        acc[lead.etapa].push(lead);
        return acc;
      }, {} as Record<string, Lead[]>);
      
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
      // Ordem padrão por ta_order
      sortedLeads.sort((a, b) => (a.ta_order ?? 0) - (b.ta_order ?? 0));
    }
    
    setLocalLeads(sortedLeads);
  }, [leads, hierarchySort, hierarchyOrder]);

  // Obter listas únicas para a hierarquia
  const uniqueProfissoes = Array.from(new Set(
    leads.map(lead => lead.profissao || 'Sem Profissão')
  )).sort();

  const uniqueEtapas = Array.from(new Set(
    leads.map(lead => lead.etapa)
  )).sort();

  // Função para definir ordem personalizada da hierarquia
  const setCustomHierarchyOrder = () => {
    const items = hierarchySort === 'profissao' ? uniqueProfissoes : uniqueEtapas;
    
    // Exemplo de ordem personalizada baseada na preferência do usuário
    if (hierarchySort === 'profissao') {
      // Priorizar certas profissões
      const priorityOrder = ['Médico', 'Dentista', 'Advogado', 'Engenheiro'];
      const customOrder = [
        ...items.filter(item => priorityOrder.includes(item)),
        ...items.filter(item => !priorityOrder.includes(item))
      ];
      setHierarchyOrder(customOrder);
    } else if (hierarchySort === 'etapa') {
      // Priorizar certas etapas
      const priorityOrder = ['Não atendido', 'Marcar', 'TA', 'Novo'];
      const customOrder = [
        ...items.filter(item => priorityOrder.includes(item)),
        ...items.filter(item => !priorityOrder.includes(item))
      ];
      setHierarchyOrder(customOrder);
    }
  };

  // Aplicar ordem personalizada quando mudar o tipo de hierarquia
  useEffect(() => {
    if (hierarchySort !== 'none') {
      setCustomHierarchyOrder();
    } else {
      setHierarchyOrder([]);
    }
  }, [hierarchySort, leads]);
  const { setNodeRef, isOver } = useDroppable({
    id: "ta-leads",
    data: {
      type: "ta-leads",
      accepts: ["sitplan-lead"]
    }
  });

  // Configurar drop zone para aceitar leads arrastados
  useEffect(() => {
    console.log('🎯 TALeadsCard: Drop zone configurada com ID:', "ta-leads");
    console.log('🎯 TALeadsCard: isOver:', isOver);
    console.log('🎯 TALeadsCard: setNodeRef configurado');
  }, [isOver]);

  // Função para mover lead para TA (chamada quando soltar um lead)
  const moveLeadToTA = async (lead: Lead) => {
    try {
      const orderValue = Math.floor(Date.now() / 1000);
      
      const { error } = await supabase
        .from("leads")
        .update({ 
          incluir_ta: true,
          incluir_sitplan: false,
          ta_order: orderValue
        })
        .eq("id", lead.id);

      if (error) throw error;

      // Invalidar queries para atualizar ambas as listas
      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
      
      toast({
        title: "Lead movido para TA!",
        description: `${lead.nome} foi movido para o TA via drag & drop.`,
      });
    } catch (error) {
      console.error("Erro ao mover lead para TA:", error);
      toast({
        title: "Erro",
        description: "Não foi possível mover o lead para TA.",
        variant: "destructive"
      });
    }
  };

  const moveAllToTA = async () => {
    try {
      console.log(' Iniciando movimentação de leads para TA...', leads.length, 'leads');
      
      // Usar um valor sequencial simples ao invés de timestamp
      const baseOrder = Math.floor(Date.now() / 1000); // Timestamp em segundos (menor)
      
      // Atualizar todos os leads para aparecerem no topo do TA
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        console.log(`📝 Atualizando lead ${lead.nome} (ID: ${lead.id})`);
        
        const { error } = await supabase
          .from("leads")
          .update({ 
            incluir_ta: true,
            incluir_sitplan: false,
            ta_order: baseOrder + i  // Usar timestamp em segundos + índice
          })
          .eq("id", lead.id);

        if (error) {
          console.error(`❌ Erro ao atualizar lead ${lead.nome}:`, error);
          throw error;
        }
        
        console.log(`✅ Lead ${lead.nome} atualizado com sucesso`);
      }

      console.log('🔄 Invalidando queries...');
      
      // Invalidar queries para atualizar ambas as listas
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      
      // Forçar refetch das queries
      await queryClient.refetchQueries({ queryKey: ["sitplan-selecionados"] });
      await queryClient.refetchQueries({ queryKey: ["ta-leads"] });
      
      console.log('✅ Queries invalidadas e refetchadas');
      
      toast({
        title: "Leads movidos para TA",
        description: `${leads.length} lead(s) foram movidos para o TA (Selecionados Sexta).`,
      });
    } catch (error) {
      console.error("❌ Erro ao mover leads para TA:", error);
      toast({
        title: "Erro",
        description: "Não foi possível mover os leads para o TA.",
        variant: "destructive"
      });
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

  const groupedLeads = localLeads.reduce((acc, lead) => {
    if (!acc[lead.etapa]) {
      acc[lead.etapa] = [];
    }
    acc[lead.etapa].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Remover lead do TA
  const removeFromTA = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ 
          incluir_ta: false,
          ta_order: null
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

  // Monitorar eventos de DnD para reordenação dentro da mesma etapa
  useDndMonitor({
    async onDragEnd(event) {
      const { active, over } = event;
      if (!active || !over) return;

      const activeData = active.data.current as any;
      const overData = over.data.current as any;

      if (activeData?.type !== "ta-item" || overData?.type !== "ta-item") return;

      const fromEtapa = activeData.containerEtapa as string;
      const toEtapa = overData.containerEtapa as string;
      const fromListId = activeData.listId as string;
      const toListId = overData.listId as string;

      // Reordenar somente quando estiver no mesmo container lógico
      if (fromListId !== toListId) return;

      const activeId = active.id as number | string;
      const overId = over.id as number | string;

      // Determinar o conjunto de itens do container
      let containerItems = [] as Lead[];
      if (fromListId.startsWith("etapa:")) {
        containerItems = localLeads.filter(l => l.etapa === fromEtapa);
      } else if (fromListId === "outras") {
        const etapasPadrao = new Set(DEFAULT_ETAPAS_ORDER);
        containerItems = localLeads.filter(l => !etapasPadrao.has(l.etapa));
      } else {
        return;
      }

      const oldIndex = containerItems.findIndex(l => l.id === activeId);
      const newIndex = containerItems.findIndex(l => l.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      // Nova ordem para a etapa
      const reordered = [...containerItems];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Atribuir novos ta_order baseados em um timestamp base
      const baseOrder = Math.floor(Date.now() / 1000);
      const idToNewOrder = new Map<number | string, number>();
      reordered.forEach((l, idx) => idToNewOrder.set(l.id, baseOrder + idx));

      // Atualização otimista no estado local
      const optimisticallyUpdated = localLeads
        .map(l => {
          const newOrder = idToNewOrder.get(l.id);
          return typeof newOrder === "number" ? { ...l, ta_order: newOrder } : l;
        })
        .sort((a, b) => (a.ta_order ?? 0) - (b.ta_order ?? 0));
      setLocalLeads(optimisticallyUpdated);

      try {
        // Persistir no Supabase
        const updates = reordered.map((l, idx) => (
          supabase
            .from("leads")
            .update({ ta_order: baseOrder + idx })
            .eq("id", l.id)
        ));
        const results = await Promise.all(updates);
        const hasError = results.some(r => (r as any).error);
        if (hasError) throw new Error("Erro ao atualizar ordem no banco");

        await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      } catch (err) {
        console.error("Erro ao persistir nova ordem de TA:", err);
        toast({
          title: "Erro ao reordenar",
          description: "Não foi possível salvar a nova ordem. Atualize a página.",
          variant: "destructive",
        });
      }
    }
  });

  const clearSelectedLeads = async () => {
    try {
      // Remover todos os leads do TA
      const { error } = await supabase
        .from("leads")
        .update({ 
          incluir_ta: false,
          ta_order: null
        })
        .eq("incluir_ta", true);

      if (error) throw error;

      // Invalidar queries para atualizar ambas as listas
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

  return (
    <Card 
      ref={setNodeRef}
      className={`transition-all duration-300 min-h-[200px] ${
        isOver 
          ? 'ring-4 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 scale-[1.02] shadow-2xl' 
          : 'hover:ring-2 hover:ring-blue-200 hover:shadow-lg'
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className={`transition-all duration-300 ${isOver ? 'text-blue-600' : ''}`}>
              Selecionados Sexta
            </span>
            {leads.length > 0 && (
              <Badge variant="secondary">{leads.length}</Badge>
            )}
          </CardTitle>
            <div className="flex gap-2">
              {/* Botão de Hierarquia TA */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`flex items-center gap-2 ${
                      hierarchySort !== 'none' ? 'border-green-500 bg-green-50 text-green-700' : ''
                    }`}
                  >
                    {hierarchySort === 'profissao' ? <ArrowUp className="w-4 h-4" /> : 
                     hierarchySort === 'etapa' ? <ArrowDown className="w-4 h-4" /> : 
                     <Filter className="w-4 h-4" />}
                    Hierarquia TA
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Ordenar TA por:</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={hierarchySort} onValueChange={(value) => setHierarchySort(value as typeof hierarchySort)}>
                    <DropdownMenuRadioItem value="none">Padrão (ta_order)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="profissao">Profissão</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="etapa">Etapa do funil</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {leads.length > 0 && (
                <>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={moveAllToTA}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    TA
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearSelectedLeads}
                  >
                    Limpar
                  </Button>
                </>
              )}
            </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {leads.length === 0 ? (
          <div className={`text-center py-6 transition-all duration-200 ${
            isOver 
              ? 'text-blue-600 bg-blue-50/50 rounded-lg border-2 border-dashed border-blue-300' 
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
                    <TAItem key={lead.id} lead={lead} etapa={lead.etapa} listId="ta-main" onRemove={removeFromTA} />
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
                          hierarchySort === 'etapa' ? getEtapaColor(groupKey) : 'bg-blue-600'
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
                            etapa={lead.etapa} 
                            listId={`hierarchy:${groupKey}`} 
                            onRemove={removeFromTA} 
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