import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Filter, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
 

 

type Lead = Tables<"leads">;

// Componente para item arrastável
interface SortableLeadItemProps {
  lead: Lead;
  removeFromSelecionados: (leadId: string) => void;
  refetch: () => void;
  getEtapaColor: (etapa: string) => string;
  calculateDaysInStage: (etapaChangedAt: string) => number;
  queryClient: any;
}

function LeadItem({ 
  lead, 
  removeFromSelecionados, 
  getEtapaColor, 
  queryClient
}: SortableLeadItemProps) {
  const { toast } = useToast();

  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-all duration-200"
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
          
          {lead.data_sitplan && (
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <span className="text-xs">📅</span>
              <span>Data SitPlan: {new Date(lead.data_sitplan).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
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

              await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
              await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
              await queryClient.refetchQueries({ queryKey: ["sitplan-selecionados"] });
              await queryClient.refetchQueries({ queryKey: ["ta-leads"] });
              
              toast({
                title: "Lead movido para TA!",
                description: `${lead.nome} foi movido para o TA (Selecionados Sexta).`,
              });
            } catch (error) {
              toast({
                title: "Erro",
                description: "Não foi possível mover o lead para o TA.",
                variant: "destructive"
              });
            }
          }}
          className="text-xs px-2 py-1 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
          title="Mover para TA (Selecionados Sexta)"
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
  );
}

export function SelecionadosCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortedLeads, setSortedLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [activeFilters, setActiveFilters] = useState<{
    profissoes: string[];
    etapas: string[];
  }>({
    profissoes: [],
    etapas: []
  });
  
  const [hierarchySort, setHierarchySort] = useState<'profissao' | 'etapa' | 'none'>('none');

  

  const { data: leads = [], refetch } = useQuery({
    queryKey: ["sitplan-selecionados"],
    queryFn: async () => {
      console.log('🔄 Buscando leads selecionados para SitPlan...');
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("incluir_sitplan", true)
        .order("created_at", { ascending: true }); // Ordem padrão por criação
      
      if (error) throw error;
      console.log(`✅ SitPlan encontrou ${data?.length || 0} leads selecionados:`, 
        data?.map(lead => ({ id: lead.id, nome: lead.nome, incluir_sitplan: lead.incluir_sitplan }))
      );
      return data as Lead[];
    },
  });

  // Atualizar lista local e filtrada quando os dados mudam
  useEffect(() => {
    let sorted = [...leads];
    
    // Aplicar hierarquia de ordenação
    if (hierarchySort === 'profissao') {
      sorted.sort((a, b) => {
        if (!a.profissao && !b.profissao) return 0;
        if (!a.profissao) return 1;
        if (!b.profissao) return -1;
        return a.profissao.localeCompare(b.profissao);
      });
    } else if (hierarchySort === 'etapa') {
      sorted.sort((a, b) => a.etapa.localeCompare(b.etapa));
    }
    
    setSortedLeads(sorted);
    setFilteredLeads(sorted);
  }, [leads, hierarchySort]);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    let filtered = [...sortedLeads];
    
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
  }, [sortedLeads, activeFilters]);

  

  

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
      const baseOrder = Math.floor(Date.now() / 1000); // Timestamp em segundos (menor)
      
      // Atualizar todos os leads alvo para aparecerem no topo do TA
      for (let i = 0; i < targetLeads.length; i++) {
        const { error } = await supabase
          .from("leads")
          .update({ 
            incluir_ta: true,
            incluir_sitplan: false,
            ta_order: baseOrder + i  // Usar timestamp em segundos + índice
          })
          .eq("id", targetLeads[i].id);

        if (error) throw error;
      }

      // Invalidar queries para atualizar ambas as listas
      await queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
      await queryClient.invalidateQueries({ queryKey: ["ta-leads"] });
      
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📋 Selecionados para SitPlan
            {leads.length > 0 && (
              <Badge variant="secondary">{leads.length}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {/* Botão de Hierarquia */}
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
                <DropdownMenuLabel>Ordenar para TA por:</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={hierarchySort} onValueChange={(value) => setHierarchySort(value as typeof hierarchySort)}>
                  <DropdownMenuRadioItem value="none">Padrão (criação)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="profissao">Profissão</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="etapa">Etapa do funil</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botão de Filtro */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`flex items-center gap-2 ${
                    hasActiveFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilters.profissoes.length + activeFilters.etapas.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
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

            {/* Botão TA existente */}
            {leads.length > 0 && (
              <Button 
                size="sm" 
                onClick={moveAllToTA}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 h-8"
                title="Mover todos os leads para TA"
              >
                TA
              </Button>
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
        {leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lead selecionado para o próximo SitPlan</p>
            <p className="text-sm mt-2">Use o botão "✅ Sim" em "Incluir no SitPlan" no Pipeline para adicionar leads aqui</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lead encontrado com os filtros aplicados</p>
            <p className="text-sm mt-2">Tente ajustar ou limpar os filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <LeadItem
                key={lead.id}
                lead={lead}
                removeFromSelecionados={removeFromSelecionados}
                refetch={refetch}
                getEtapaColor={getEtapaColor}
                calculateDaysInStage={calculateDaysInStage}
                queryClient={queryClient}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}