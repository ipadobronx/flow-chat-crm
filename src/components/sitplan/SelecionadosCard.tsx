import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Filter, ChevronDown, Users, CheckSquare, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useSortable } from "@dnd-kit/sortable";
import { useDndMonitor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { Checkbox } from "@/components/ui/checkbox";
import GlassProgressBar from "@/components/ui/glass-progress-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useIsTablet } from "@/hooks/use-tablet";
import { cn } from "@/lib/utils";

type Lead = Tables<"leads">;

// Componente para item arrastável do SitPlan
interface SortableSitPlanLeadItemProps {
  lead: Lead;
  removeFromSelecionados: (leadId: string) => void;
  getEtapaColor: (etapa: string) => string;
  queryClient: any;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: (id: string) => void;
}

function SortableSitPlanLeadItem({ 
  lead, 
  removeFromSelecionados, 
  getEtapaColor, 
  queryClient,
  isSelectionMode = false,
  isSelected = false,
  onSelectionToggle
}: SortableSitPlanLeadItemProps) {
  const { toast } = useToast();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: {
      type: "sitplan-lead",
      lead: lead
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
      {...(isSelectionMode ? {} : { ...attributes, ...listeners })}
      className={`flex items-center justify-between p-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all duration-150 ${
        isDragging ? "opacity-70 shadow-md scale-[0.98]" : "hover:shadow-sm"
      } ${isSelected ? "ring-2 ring-blue-500 bg-blue-100/20" : ""}`}
    >
      <div className="flex items-center gap-3 flex-1">
        {isSelectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectionToggle?.(lead.id)}
            className="flex-shrink-0 border-white/50"
          />
        )}
        <div className="flex-1 min-w-0" {...(isSelectionMode ? {} : { ...attributes, ...listeners })}>
          <div className="mb-2">
            <h4 className="font-semibold text-base truncate text-white">
              {lead.nome}
            </h4>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <Badge className={`text-white text-xs px-2 py-1 flex-shrink-0 ${getEtapaColor(lead.etapa)}`}>
              {lead.etapa}
            </Badge>
            
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
          
          {lead.data_sitplan && (
            <div className="mt-2 flex items-center gap-1 text-sm text-white/70">
              <span>Data SitPlan: {new Date(lead.data_sitplan).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            removeFromSelecionados(lead.id);
          }}
          className="text-white/70 hover:text-destructive hover:bg-white/10 h-8 w-8 p-0"
          title="Remover do SitPlan"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export function SelecionadosCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortedLeads, setSortedLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [showConfirmAll, setShowConfirmAll] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    profissoes: string[];
    etapas: string[];
  }>({
    profissoes: [],
    etapas: []
  });

  // Hook para seleção múltipla
  const multiSelect = useMultiSelect({
    onSelectionComplete: async (selectedIds) => {
      await moveSelectedToTA(selectedIds);
    }
  });

  const { data: leads = [], refetch, isLoading } = useQuery({
    queryKey: ["sitplan-selecionados"],
    queryFn: async () => {
      console.log('🔄 Buscando leads selecionados para SitPlan...');
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("incluir_sitplan", true)
        .order("created_at", { ascending: true }); 
      
      if (error) throw error;
      console.log(`✅ SitPlan encontrou ${data?.length || 0} leads selecionados:`, 
        data?.map(lead => ({ id: lead.id, nome: lead.nome, incluir_sitplan: lead.incluir_sitplan }))
      );
      return data as Lead[];
    },
  });

  // Atualizar lista local quando os dados mudam
  useEffect(() => {
    setSortedLeads(leads);
    setFilteredLeads(leads);
    setLocalLeads(leads);
  }, [leads]);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    let filtered = [...localLeads];
    
    // Filtrar por profissões
    if (activeFilters.profissoes.length > 0) {
      filtered = filtered.filter(lead => 
        lead.profissao && activeFilters.profissoes.includes(lead.profissao)
      );
    }
    
    // Filtrar por etapas
    if (activeFilters.etapas.length > 0) {
      filtered = filtered.filter(lead => 
        activeFilters.etapas.includes(lead.etapa)
      );
    }
    
    setFilteredLeads(filtered);
  }, [localLeads, activeFilters]);

  // Monitorar drag and drop para reordenação
  useDndMonitor({
    async onDragEnd(event) {
      const { active, over } = event;
      if (!active || !over) return;

      const activeData = active.data.current as any;
      const overData = over.data.current as any;

      // Reordenação dentro do SelecionadosCard
      if (activeData?.type === "sitplan-lead" && overData?.type === "sitplan-lead") {
        const oldIndex = localLeads.findIndex(l => l.id === active.id);
        const newIndex = localLeads.findIndex(l => l.id === over.id);
        
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        // Reordenar otimisticamente
        const reordered = [...localLeads];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        
        setLocalLeads(reordered);
        
        try {
          // Persistir nova ordem no banco usando created_at para ordenação simples
          const baseTime = new Date();
          const updates = reordered.map((lead, index) => {
            const newCreatedAt = new Date(baseTime.getTime() + index * 1000).toISOString();
            
            // Validar data antes de enviar
            if (isNaN(new Date(newCreatedAt).getTime())) {
              throw new Error("Data inválida");
            }
            
            return supabase
              .from("leads")
              .update({ created_at: newCreatedAt })
              .eq("id", lead.id);
          });
          
          const results = await Promise.all(updates);
          const hasError = results.some(r => (r as any).error);
          if (hasError) throw new Error("Erro ao atualizar ordem no banco");
          
          await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
        } catch (err) {
          console.error("Erro ao persistir nova ordem:", err);
          toast({
            title: "Erro ao reordenar",
            description: "Não foi possível salvar a nova ordem. Atualize a página.",
            variant: "destructive",
          });
          // Reverter mudança otimística
          setLocalLeads(leads);
        }
      }
    }
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

      // Invalidar queries para atualizar ambas as listas
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      
      // Forçar refetch das queries para garantir sincronização
      await queryClient.refetchQueries({ queryKey: ["sitplan-selecionados"] });
      await queryClient.refetchQueries({ queryKey: ["ta-leads"] });
      
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

  const moveAllToTA = async () => {
    try {
      // Quando houver filtros ativos, mover apenas os filtrados; caso contrário, mover todos
      const targetLeads = hasActiveFilters ? filteredLeads : leads;

      if (!targetLeads || targetLeads.length === 0) {
        toast({
          title: "Nada a mover",
          description: hasActiveFilters ? "Nenhum lead corresponde aos filtros atuais." : "Não há leads para mover.",
        });
        return;
      }

      // Usar um valor sequencial simples ao invés de timestamp
      const baseOrder = Math.floor(Date.now() / 1000);
      
      // Atualizar todos os leads alvo para aparecerem no topo do TA
      for (let i = 0; i < targetLeads.length; i++) {
        const lead = targetLeads[i];
        
        // Sem filtros: permitir que apareçam em ambas as categorias
        const { error } = await supabase
          .from("leads")
          .update({ 
            etapa_antes_ta: lead.etapa,
            etapa: 'TA',
            etapa_changed_at: new Date().toISOString(),
            incluir_ta: true,
            incluir_sitplan: false,
            ta_order: baseOrder + i,
            ta_categoria_ativa: null, // Sem categoria específica
            ta_categoria_valor: null,
            ta_exclusividade: false // Sem exclusividade - aparece em ambas
          })
          .eq("id", lead.id);

        if (error) throw error;
      }

      // Invalidar queries para atualizar ambas as listas
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      await queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
      
      // Forçar refetch das queries para garantir sincronização
      await queryClient.refetchQueries({ queryKey: ["sitplan-selecionados"] });
      await queryClient.refetchQueries({ queryKey: ["ta-leads"] });
      
      toast({
        title: "Leads movidos para TA",
        description: `${targetLeads.length} lead(s) foram movidos para o TA (Selecionados Sexta).`,
      });
    } catch (error) {
      console.error("Erro ao mover leads para TA:", error);
      toast({
        title: "Erro",
        description: hasActiveFilters ? "Não foi possível mover os leads filtrados." : "Não foi possível mover os leads.",
        variant: "destructive"
      });
    }
  };

  const moveSelectedToTA = async (selectedIds: string[]) => {
    try {
      if (selectedIds.length === 0) return;

      const baseOrder = Math.floor(Date.now() / 1000);
      
      for (let i = 0; i < selectedIds.length; i++) {
        const lead = leads.find(l => l.id === selectedIds[i]);
        if (!lead) continue;

        // Sem filtros: permitir que apareçam em ambas as categorias  
        const { error } = await supabase
          .from("leads")
          .update({ 
            etapa_antes_ta: lead.etapa,
            etapa: 'TA',
            etapa_changed_at: new Date().toISOString(),
            incluir_ta: true,
            incluir_sitplan: false,
            ta_order: baseOrder + i,
            ta_categoria_ativa: null, // Sem categoria específica
            ta_categoria_valor: null,
            ta_exclusividade: false // Sem exclusividade - aparece em ambas
          })
          .eq("id", selectedIds[i]);

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      await queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
      
      toast({
        title: "Leads selecionados movidos para TA",
        description: `${selectedIds.length} lead(s) foram movidos para o TA.`,
      });
    } catch (error) {
      console.error("Erro ao mover leads selecionados para TA:", error);
      toast({
        title: "Erro",
        description: "Não foi possível mover os leads selecionados.",
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
      case "Não": return "bg-gray-500";
      case "Proposta Cancelada": return "bg-red-600";
      case "Persistência": return "bg-amber-600";
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

  // Obter profissões únicas dos leads
  const uniqueProfissoes = Array.from(new Set(
    leads
      .map(lead => lead.profissao)
      .filter(Boolean) as string[]
  )).sort();

  // Obter etapas únicas dos leads
  const uniqueEtapas = Array.from(new Set(
    leads.map(lead => lead.etapa)
  )).sort();

  const toggleProfissaoFilter = (profissao: string) => {
    setActiveFilters(prev => ({
      ...prev,
      profissoes: prev.profissoes.includes(profissao)
        ? prev.profissoes.filter(p => p !== profissao)
        : [...prev.profissoes, profissao]
    }));
  };

  const toggleEtapaFilter = (etapa: string) => {
    setActiveFilters(prev => ({
      ...prev,
      etapas: prev.etapas.includes(etapa)
        ? prev.etapas.filter(e => e !== etapa)
        : [...prev.etapas, etapa]
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      profissoes: [],
      etapas: []
    });
  };

  const hasActiveFilters = activeFilters.profissoes.length > 0 || activeFilters.etapas.length > 0;

  

  return (
    <Card className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            Selecionados para SitPlan
            {leads.length > 0 && (
              <Badge variant="secondary">{leads.length}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {/* Botão de Filtro */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`h-6 w-6 p-0 rounded-full border-white/30 bg-white/10 hover:bg-white/20 ${
                    hasActiveFilters ? 'border-blue-500 bg-blue-100/20 text-blue-400' : 'text-white'
                  }`}
                  aria-label="Filtros"
                >
                  <Menu className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border border-white/20 bg-black/80 backdrop-blur-md text-white">
                <DropdownMenuLabel>Filtrar por Profissão</DropdownMenuLabel>
                {uniqueProfissoes.length > 0 ? (
                  uniqueProfissoes.map(profissao => (
                    <DropdownMenuCheckboxItem
                      key={profissao}
                      checked={activeFilters.profissoes.includes(profissao)}
                      onCheckedChange={() => toggleProfissaoFilter(profissao)}
                    >
                      {profissao}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    Nenhuma profissão disponível
                  </div>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Filtrar por Etapa</DropdownMenuLabel>
                {uniqueEtapas.map(etapa => (
                  <DropdownMenuCheckboxItem
                    key={etapa}
                    checked={activeFilters.etapas.includes(etapa)}
                    onCheckedChange={() => toggleEtapaFilter(etapa)}
                  >
                    {etapa}
                  </DropdownMenuCheckboxItem>
                ))}
                
                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      onCheckedChange={clearAllFilters}
                      className="text-red-600 focus:text-red-600"
                    >
                      Limpar todos os filtros
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botões Verde e Azul - Padrão Pipeline */}
            {leads.length > 0 && (
              <>
                <Button
                  size="sm"
                  className="h-6 w-6 p-0 bg-[#d4ff4a] hover:bg-[#c9f035] text-black rounded-full shadow-sm border-0 transition-all duration-200 hover:scale-105"
                  onClick={() => setShowConfirmAll(true)}
                  title="Mover todos os leads filtrados para TA"
                >
                  <Users className="h-3 w-3" />
                </Button>
                
                <Button
                  size="sm"
                  className={`h-6 w-6 p-0 rounded-full shadow-sm border-0 transition-all duration-200 hover:scale-105 ${
                    multiSelect.isSelectionMode 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                  onClick={() => {
                    if (multiSelect.isSelectionMode) {
                      multiSelect.exitSelectionMode();
                    } else {
                      multiSelect.toggleSelectionMode();
                    }
                  }}
                  title={multiSelect.isSelectionMode ? "Cancelar seleção" : "Selecionar individualmente"}
                >
                  {multiSelect.isSelectionMode ? <X className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
                </Button>
              </>
            )}

            {/* Botões de ação da seleção múltipla */}
            {multiSelect.isSelectionMode && multiSelect.selectedCount > 0 && (
              <div className="flex gap-2 ml-2">
                <Button 
                  size="sm" 
                  onClick={multiSelect.confirmSelection}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-7 text-xs"
                >
                  Mover {multiSelect.selectedCount} para TA
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={multiSelect.clearSelections}
                  className="px-3 py-1 h-7 text-xs"
                >
                  Limpar
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Indicador de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filtros ativos:</span>
            {activeFilters.profissoes.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {activeFilters.profissoes.length} profissão(ões)
              </Badge>
            )}
            {activeFilters.etapas.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {activeFilters.etapas.length} etapa(s)
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
            >
              Limpar
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading && (
          <div className="py-2">
            <GlassProgressBar progress={65} />
            <div className="mt-2 text-center text-sm text-muted-foreground">Carregando selecionados...</div>
          </div>
        )}
        {leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lead selecionado para o próximo SitPlan</p>
            <p className="text-sm mt-2">Use o botão "Sim" em "Incluir no SitPlan" no Pipeline para adicionar leads aqui</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lead encontrado com os filtros aplicados</p>
            <p className="text-sm mt-2">Tente ajustar ou limpar os filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
            <SortableContext
              items={filteredLeads.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredLeads.map((lead) => (
                <SortableSitPlanLeadItem
                  key={lead.id}
                  lead={lead}
                  removeFromSelecionados={removeFromSelecionados}
                  getEtapaColor={getEtapaColor}
                  queryClient={queryClient}
                  isSelectionMode={multiSelect.isSelectionMode}
                  isSelected={multiSelect.isSelected(lead.id)}
                  onSelectionToggle={multiSelect.toggleSelection}
                />
              ))}
            </SortableContext>
          </div>
        )}
      </CardContent>
      
      {/* Dialog de confirmação para mover todos */}
      <AlertDialog open={showConfirmAll} onOpenChange={setShowConfirmAll}>
        <AlertDialogContent className="rounded-2xl border border-border/30 bg-border/10 backdrop-blur-md shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-inter font-normal tracking-tighter text-lg">Mover todos para TA</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-black">
              {hasActiveFilters 
                ? `Você está prestes a mover ${filteredLeads.length} lead(s) filtrado(s) para o TA (Selecionados Sexta).`
                : `Você está prestes a mover ${leads.length} lead(s) para o TA (Selecionados Sexta).`
              }
              <br />Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full px-6 py-3 font-inter font-light bg-transparent border border-border/30 text-foreground hover:bg-white/10 transition-colors">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await moveAllToTA();
                setShowConfirmAll(false);
              }}
              className="rounded-full px-6 py-3 font-inter font-light bg-black text-white hover:bg-black/80 transition-colors"
            >
              Mover para TA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}