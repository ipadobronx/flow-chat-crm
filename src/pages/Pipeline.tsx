
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import OutlineButton from "@/components/ui/outline-button";
import LiquidGlassInput from "@/components/ui/liquid-input";
import { Label } from "@/components/ui/label";
import LiquidGlassTextarea from "@/components/ui/liquid-textarea";
import CheckedSwitch from "@/components/ui/checked-switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, MessageSquare, Calendar as CalendarIcon, ArrowRight, Clock, Edit2, Trash2, X, Check, Filter, CheckSquare, Square, Users, Plus, PlayCircle } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { LeadHistory } from "@/components/sitplan/LeadHistory";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import GlassProgressBar from "@/components/ui/glass-progress-bar";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { ProfissaoCombobox } from "@/components/ui/profissao-combobox";
import { StageTimeHistory } from "@/components/dashboard/StageTimeHistory";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { updateLeadPartialSchema } from "@/lib/schemas";
import { globalRateLimiter } from "@/lib/validation";
import { z } from "zod";
import { useIsTablet } from "@/hooks/use-tablet";

const stages = [
  { name: "Todos", label: "Todos", color: "bg-blue-500" },
  { name: "Novo", label: "Novo", color: "bg-sky-500" },
  { name: "TA", label: "TA", color: "bg-purple-600" },
  { name: "Não atendido", label: "Não Atendido", color: "bg-red-600" },
  { name: "Ligar Depois", label: "Ligar Depois", color: "bg-yellow-600" },
  { name: "Marcar", label: "Marcar", color: "bg-green-600" },
  { name: "OI", label: "OI", color: "bg-indigo-500" },
  { name: "Delay OI", label: "Delay OI", color: "bg-yellow-500" },
  { name: "PC", label: "PC", color: "bg-orange-500" },
  { name: "Delay PC", label: "Delay PC", color: "bg-red-500" },
  { name: "Analisando Proposta", label: "Analisando Proposta", color: "bg-orange-600" },
  { name: "Pendência de UW", label: "Pendência de UW", color: "bg-yellow-700" },
  { name: "C2", label: "C2", color: "bg-pink-500" },
  { name: "Delay C2", label: "Delay C2", color: "bg-rose-500" },
  { name: "N", label: "N", color: "bg-purple-500" },
  { name: "Não", label: "Não", color: "bg-gray-500" },
  { name: "Proposta Não Apresentada", label: "Proposta Não Apresentada", color: "bg-gray-600" },
  { name: "Proposta Cancelada", label: "Proposta Cancelada", color: "bg-red-700" },
  { name: "Apólice Emitida", label: "Apólice Emitida", color: "bg-green-500" },
  { name: "Apólice Entregue", label: "Apólice Entregue", color: "bg-emerald-600" },
  { name: "Apólice Cancelada", label: "Apólice Cancelada", color: "bg-red-800" },
  { name: "Placed", label: "Placed", color: "bg-teal-500" }
] as const;

type Lead = {
  id: string;
  nome: string;
  empresa: string | null;
  valor: string | null;
  telefone: string | null;
  celular_secundario: string | null;
  email: string | null;
  idade: number | null;
  profissao: string | null;
  renda_estimada: string | null;
  cidade: string | null;
  recomendante: string[] | null;
  etapa: Database["public"]["Enums"]["etapa_funil"];
  status: string | null;
  data_callback: string | null;
  hora_callback?: string | null;
  data_nascimento: string | null;
  high_ticket: boolean;
  casado: boolean;
  tem_filhos: boolean;
  quantidade_filhos: number | null;
  avisado: boolean;
  incluir_sitplan: boolean;
  observacoes: string | null;
  pa_estimado: string | null;
  data_sitplan: string | null;
  dias_na_etapa_atual: number | null;
};

// Componente para card arrastável otimizado
const DraggableLeadCard = ({ 
  lead, 
  onClick, 
  isSelectionMode,
  isSelected,
  onToggleSelection,
  stageName,
  isTabletMode = false
}: { 
  lead: Lead; 
  onClick: () => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (leadId: string) => void;
  stageName: string;
  isTabletMode?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: isSelectionMode, // Disable drag during selection mode
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleCheckboxChange = (checked: boolean) => {
    onToggleSelection(lead.id);
  };

  const handleCardClick = () => {
    if (isSelectionMode) {
      onToggleSelection(lead.id);
    } else {
      onClick();
    }
  };

  // Card classes based on tablet mode
  const cardClasses = isTabletMode
    ? `p-2 sm:p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 relative cursor-pointer group shadow-lg ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${isSelected ? 'ring-1 ring-[#d4ff4a]/50 bg-[#d4ff4a]/10' : ''}`
    : `p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all relative cursor-pointer group ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${isSelected ? 'ring-1 ring-blue-400/50 bg-blue-50/50' : ''}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isSelectionMode ? {} : listeners)}
      {...(isSelectionMode ? {} : attributes)}
      className={cardClasses}
      onClick={handleCardClick}
    >
      {/* Checkbox minimalista para multi-seleção */}
      {isSelectionMode && (
        <div className="absolute top-2 right-2 z-10">
          <div 
            className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
              isSelected 
                ? isTabletMode ? 'bg-[#d4ff4a] border-[#d4ff4a]' : 'bg-blue-500 border-blue-500'
                : isTabletMode ? 'border-white/30 hover:border-white/50 bg-white/10' : 'border-blue-300 hover:border-blue-400 bg-white'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleCheckboxChange(!isSelected);
            }}
          >
            {isSelected && (
              <Check className={`h-3 w-3 ${isTabletMode ? 'text-black' : 'text-white'}`} />
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-start space-x-2 sm:space-x-3">
        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
          <AvatarFallback className={`text-xs sm:text-sm ${isTabletMode ? 'bg-white/10 text-white' : ''}`}>
            {lead.nome.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-start justify-between">
            <p className={`font-medium text-xs sm:text-sm truncate flex-1 ${isTabletMode ? 'text-white' : ''}`}>
              {lead.nome}
            </p>
            {/* Contagem de dias no canto superior direito */}
            {lead.etapa !== "Todos" && (
              <Badge className={`ml-2 text-xs px-1.5 py-0.5 shrink-0 ${
                isTabletMode 
                  ? 'bg-[#d4ff4a]/20 text-[#d4ff4a] border-[#d4ff4a]/30' 
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}>
                {lead.dias_na_etapa_atual || 1}d
              </Badge>
            )}
          </div>
          <p className={`text-xs truncate ${isTabletMode ? 'text-white/60' : 'text-muted-foreground'}`}>
            {lead.recomendante && Array.isArray(lead.recomendante) && lead.recomendante.length > 0 
              ? lead.recomendante.join(", ") 
              : "Sem recomendante"}
          </p>
          <p className={`text-xs sm:text-sm font-semibold mt-1 ${isTabletMode ? 'text-[#d4ff4a]' : 'text-success'}`}>
            {lead.profissao || "Profissão não informada"}
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente para área droppable otimizado
const DroppableColumn = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`h-full transition-colors duration-200 ${
        isOver ? 'bg-primary/10 rounded-lg' : ''
      }`}
    >
      {children}
    </div>
  );
};

export default function Pipeline() {
  const { user } = useAuth();
  const googleCalendar = useGoogleCalendar();
  const { syncCalendarEvent, isConnected } = useCalendarSync();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isTablet } = useIsTablet();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [ligacoesHistorico, setLigacoesHistorico] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [editingLigacao, setEditingLigacao] = useState<string | null>(null);
  const [ligacaoParaExcluir, setLigacaoParaExcluir] = useState<any | null>(null);
  const [novoTipoLigacao, setNovoTipoLigacao] = useState<{ [key: string]: string }>({});
  const [showOnlySitplan, setShowOnlySitplan] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("showOnlySitplan");
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [isGlobalSelectionMode, setIsGlobalSelectionMode] = useState(false);
  const [stageToInclude, setStageToInclude] = useState<string | null>(null);
  
  // Estados para o popup de "Ligar Depois"
  const [showLigarDepoisDialog, setShowLigarDepoisDialog] = useState(false);
  const [leadParaLigarDepois, setLeadParaLigarDepois] = useState<Lead | null>(null);
  const [dataAgendamento, setDataAgendamento] = useState<Date | undefined>(undefined);
  const [horarioAgendamento, setHorarioAgendamento] = useState<string>("");
  const [observacoesAgendamento, setObservacoesAgendamento] = useState("");

  // Buscar agendamento mais recente para o lead selecionado
  const { data: agendamentoMaisRecente } = useQuery({
    queryKey: ['agendamento-lead', selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead?.id) return null;
      
      const { data } = await supabase
        .from('agendamentos_ligacoes')
        .select('data_agendamento, id')
        .eq('lead_id', selectedLead.id)
        .eq('status', 'pendente')
        .order('data_agendamento', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
    enabled: !!selectedLead?.id
  });

  // Preencher campo de agendamento automaticamente quando houver agendamento existente
  useEffect(() => {
    if (agendamentoMaisRecente && selectedLead && !editingLead?.data_callback) {
      const dataAgendamento = new Date(agendamentoMaisRecente.data_agendamento);
      setEditingLead({
        ...selectedLead,
        data_callback: dataAgendamento.toISOString(),
        hora_callback: format(dataAgendamento, 'HH:mm')
      });
    }
  }, [agendamentoMaisRecente, selectedLead, editingLead]);

  useEffect(() => {
    try {
      localStorage.setItem("showOnlySitplan", JSON.stringify(showOnlySitplan));
    } catch {}
  }, [showOnlySitplan]);

  useEffect(() => {
    const listener = (e: any) => {
      const value = !!e.detail?.value;
      setShowOnlySitplan(value);
    };
    window.addEventListener("sitplan-filter-toggle", listener);
    return () => window.removeEventListener("sitplan-filter-toggle", listener);
  }, []);

  // Multi-select functionality
  const multiSelect = useMultiSelect({
    onSelectionComplete: async (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      
      try {
        console.log(`🎯 Incluindo ${selectedIds.length} leads selecionados no SitPlan`);
        
        const { error } = await supabase
          .from('leads')
          .update({ 
            incluir_sitplan: true,
            updated_at: new Date().toISOString()
          })
          .in('id', selectedIds);

        if (error) throw error;

        // Update local state
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            selectedIds.includes(lead.id)
              ? { ...lead, incluir_sitplan: true }
              : lead
          )
        );

        toast({
          title: "Leads incluídos!",
          description: `${selectedIds.length} leads foram adicionados ao SitPlan.`,
        });

        // Reset selection state
        setIsGlobalSelectionMode(false);

      } catch (error) {
        console.error('Erro ao incluir leads selecionados no SitPlan:', error);
        toast({
          title: "Erro",
          description: "Não foi possível incluir os leads no SitPlan.",
          variant: "destructive"
        });
      }
    }
  });

  // Send all leads from a stage to SitPlan
  const handleIncludeAllStage = async (stageName: string) => {
    const stageLeads = getLeadsByStage(stageName);
    const leadIds = stageLeads.map(lead => lead.id);
    
    if (leadIds.length === 0) return;
    
    try {
      console.log(`🎯 Incluindo todos os ${leadIds.length} leads da etapa ${stageName} no SitPlan`);
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          incluir_sitplan: true,
          updated_at: new Date().toISOString()
        })
        .in('id', leadIds);

      if (error) throw error;

      // Update local state
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          leadIds.includes(lead.id)
            ? { ...lead, incluir_sitplan: true }
            : lead
        )
      );

      toast({
        title: "Etapa incluída!",
        description: `Todos os ${leadIds.length} leads da etapa ${stageName} foram adicionados ao SitPlan.`,
      });

      setStageToInclude(null);

    } catch (error) {
      console.error('Erro ao incluir leads da etapa no SitPlan:', error);
      toast({
        title: "Erro",
        description: "Não foi possível incluir os leads da etapa no SitPlan.",
        variant: "destructive"
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  // Buscar leads do Supabase com otimização + realtime
  useEffect(() => {
    let isMounted = true;
    
    async function fetchLeads() {
      if (!user) return;
      
      try {
        console.log('🔄 Buscando leads do Pipeline...');
        const { data, error } = await supabase
          .from('leads')
          .select('id, nome, empresa, valor, telefone, celular_secundario, email, idade, profissao, renda_estimada, cidade, recomendante, etapa, status, data_callback, data_nascimento, high_ticket, casado, tem_filhos, quantidade_filhos, avisado, incluir_sitplan, observacoes, pa_estimado, data_sitplan, dias_na_etapa_atual')
          .eq('user_id', user.id);

        if (error) throw error;
        if (isMounted) {
          setLeads(data || []);
          console.log(`📊 Pipeline carregou ${data?.length || 0} leads`);
          
          // Log leads with incluir_sitplan = true
          const sitplanLeads = data?.filter(lead => lead.incluir_sitplan) || [];
          console.log(`✅ Leads marcados para SitPlan no Pipeline: ${sitplanLeads.length}`, 
            sitplanLeads.map(lead => ({ id: lead.id, nome: lead.nome, incluir_sitplan: lead.incluir_sitplan }))
          );
        }
      } catch (error) {
        console.error('Erro ao buscar leads:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLeads();

    // Configurar realtime para sincronização automática
    const channel = supabase
      .channel('pipeline-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔴 Mudança detectada na tabela leads:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newLead = payload.new as Lead;
            setLeads(prev => {
              const index = prev.findIndex(lead => lead.id === newLead.id);
              if (index >= 0) {
                // Atualizar lead existente
                const updated = [...prev];
                updated[index] = newLead;
                return updated;
              } else {
                // Adicionar novo lead
                return [...prev, newLead];
              }
            });
            
            // Invalidar cache do SitPlan para sincronização
            queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setLeads(prev => prev.filter(lead => lead.id !== deletedId));
            queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
          }
        }
      )
      .subscribe();
    
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Organizar leads por etapa com memoização
  const getLeadsByStage = useCallback((stageName: string) => {
    const stageLeads = leads.filter(lead => {
      const etapaMatch = lead.etapa === stageName;
      if (showOnlySitplan) {
        const result = etapaMatch && lead.incluir_sitplan;
        if (result) {
          console.log(`🎯 Lead ${lead.nome} incluído no filtro SitPlan para etapa ${stageName}`);
        }
        return result;
      }
      return etapaMatch;
    });
    
    if (showOnlySitplan && stageLeads.length > 0) {
      console.log(`📊 Etapa ${stageName} com filtro SitPlan: ${stageLeads.length} leads`, 
        stageLeads.map(lead => lead.nome));
    }
    
    return stageLeads;
  }, [leads, showOnlySitplan]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // Encontrar o lead sendo movido
    const draggedLead = leads.find(lead => lead.id === activeId);
    if (!draggedLead) {
      setActiveId(null);
      return;
    }
    
    // Verificar se overId é uma etapa válida
    const targetStage = stages.find(stage => stage.name === overId);
    if (!targetStage || draggedLead.etapa === overId) {
      setActiveId(null);
      return;
    }

    // Se for arrastado para "Ligar Depois", mostrar popup obrigatório
    if (overId === "Ligar Depois") {
      setLeadParaLigarDepois(draggedLead);
      
      // Pré-popular com dados da etapa anterior
      if (draggedLead.data_callback) {
        setDataAgendamento(new Date(draggedLead.data_callback));
      } else {
        setDataAgendamento(undefined);
      }
      
      if (draggedLead.observacoes) {
        setObservacoesAgendamento(draggedLead.observacoes);
      } else {
        setObservacoesAgendamento("");
      }
      
      setShowLigarDepoisDialog(true);
      setActiveId(null);
      return;
    }

    // Atualizar estado local imediatamente para UI responsiva
    setLeads(prev => prev.map(lead => 
      lead.id === activeId 
        ? { ...lead, etapa: overId as Database["public"]["Enums"]["etapa_funil"] }
        : lead
    ));
    
    setActiveId(null);
    
    // Atualizar no Supabase em background
    try {
      const { error } = await supabase
        .from('leads')
        .update({ etapa: overId as Database["public"]["Enums"]["etapa_funil"] })
        .eq('id', activeId);

      if (error) {
        // Reverter mudança local se houver erro
        setLeads(prev => prev.map(lead => 
          lead.id === activeId 
            ? { ...lead, etapa: draggedLead.etapa }
            : lead
        ));
        console.error('Erro ao atualizar lead:', error);
      } else {
        console.log(`Moving ${draggedLead.nome} from ${draggedLead.etapa} to ${overId}`);
      }
    } catch (error) {
      // Reverter mudança local em caso de falha
      setLeads(prev => prev.map(lead => 
        lead.id === activeId 
          ? { ...lead, etapa: draggedLead.etapa }
          : lead
      ));
      console.error('Erro ao atualizar lead:', error);
    }
  }, [leads]);

  const handleSaveLead = useCallback(async () => {
    if (!editingLead || !user) return;

    // Rate limiting check
    if (!globalRateLimiter.canSubmit(`${user.id}-update-lead`)) {
      toast({
        title: "Muitas atualizações",
        description: "Aguarde alguns segundos antes de salvar novamente.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Validate user-provided fields
      const validatedData = updateLeadPartialSchema.parse({
        observacoes: editingLead.observacoes,
        pa_estimado: editingLead.pa_estimado,
        etapa: editingLead.etapa,
      });

      // Record this submission for rate limiting
      globalRateLimiter.recordSubmission(`${user.id}-update-lead`);

      const { error } = await supabase
        .from('leads')
        .update({
          etapa: validatedData.etapa as Database["public"]["Enums"]["etapa_funil"],
          data_callback: editingLead.data_callback,
          data_nascimento: editingLead.data_nascimento,
          observacoes: validatedData.observacoes,
          pa_estimado: validatedData.pa_estimado,
          high_ticket: editingLead.high_ticket,
          casado: editingLead.casado,
          tem_filhos: editingLead.tem_filhos,
          quantidade_filhos: editingLead.quantidade_filhos,
          avisado: editingLead.avisado,
          incluir_sitplan: editingLead.incluir_sitplan,
          celular_secundario: editingLead.celular_secundario,
          email: editingLead.email,
          idade: editingLead.idade,
          profissao: editingLead.profissao,
          renda_estimada: editingLead.renda_estimada,
          cidade: editingLead.cidade,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingLead.id);

      if (error) throw error;

      // Se a etapa mudou, registrar no histórico
      if (editingLead.etapa !== selectedLead.etapa) {
        await supabase
          .from("historico_etapas_funil")
          .insert({
            lead_id: selectedLead.id,
            user_id: user.id,
            etapa_anterior: selectedLead.etapa,
            etapa_nova: editingLead.etapa,
            observacoes: editingLead.observacoes
          });
      }

      // Sincronizar agendamento com Google Calendar (se data foi preenchida ou modificada)
      if (editingLead.data_callback && editingLead.data_callback !== selectedLead.data_callback) {
        try {
          const dataAgendamento = new Date(editingLead.data_callback);
          
          // Verificar se já existe agendamento pendente para este lead
          const { data: agendamentoExistente } = await supabase
            .from('agendamentos_ligacoes')
            .select('id')
            .eq('lead_id', selectedLead.id)
            .eq('status', 'pendente')
            .maybeSingle();

          if (agendamentoExistente) {
            // Atualizar agendamento existente
            await supabase
              .from('agendamentos_ligacoes')
              .update({
                data_agendamento: dataAgendamento.toISOString(),
                observacoes: editingLead.observacoes,
                updated_at: new Date().toISOString()
              })
              .eq('id', agendamentoExistente.id);
            
            toast({
              title: "✅ Agendamento atualizado!",
              description: "Agendamento existente foi atualizado.",
            });
          } else {
            // Criar novo agendamento
            const wasSynced = await syncCalendarEvent({
              leadId: selectedLead.id,
              leadNome: selectedLead.nome,
              dataAgendamento,
              observacoes: editingLead.observacoes,
              tipo: 'callback'
            });

            if (wasSynced) {
              toast({
                title: "✅ Salvo e sincronizado!",
                description: "Lead atualizado e agendamento criado no Google Calendar.",
              });
            } else if (isConnected) {
              toast({
                title: "⚠️ Salvo (sincronização falhou)",
                description: "Lead atualizado, mas houve erro ao sincronizar com Google Calendar.",
                variant: "destructive"
              });
            } else {
              toast({
                title: "✅ Lead atualizado!",
                description: "Agendamento salvo localmente. Conecte o Google Calendar para sincronizar.",
              });
            }
          }
        } catch (syncError) {
          console.error('Erro ao sincronizar agendamento:', syncError);
          toast({
            title: "⚠️ Erro na sincronização",
            description: "Lead foi salvo, mas não foi possível criar o agendamento.",
            variant: "destructive"
          });
        }
      } else if (!editingLead.data_callback && editingLead.etapa === selectedLead.etapa) {
        toast({
          title: "✅ Lead atualizado!",
          description: "As alterações foram salvas com sucesso.",
        });
      }

      // Atualizar estado local - se mudou de etapa, remover da lista atual
      if (editingLead.etapa !== selectedLead.etapa) {
        setLeads((prevLeads) => prevLeads.filter(lead => lead.id !== selectedLead.id));
        toast({
          title: "✅ Lead movido!",
          description: `Lead movido para ${editingLead.etapa}.`,
        });
      } else {
        // Apenas atualizar os dados do lead
        setLeads(prev => prev.map(lead => 
          lead.id === editingLead.id ? editingLead : lead
        ));
      }

       setSelectedLead(editingLead);
       
       // Invalidar cache do SitPlan se incluir_sitplan foi alterado
       if (editingLead.incluir_sitplan !== undefined) {
         queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
         console.log('🔄 Cache do SitPlan invalidado - sincronização ativada');
       }
     } catch (error) {
       if (error instanceof z.ZodError) {
         toast({
           title: "Erro de validação",
           description: error.errors[0].message,
           variant: "destructive",
         });
       } else {
         console.error('Erro ao salvar lead:', error);
         toast({
           title: "Erro",
           description: "Não foi possível salvar as alterações.",
           variant: "destructive",
         });
       }
    } finally {
      setSaving(false);
    }
  }, [editingLead, user, toast, selectedLead, syncCalendarEvent, isConnected, queryClient]);

  // Função para processar agendamento "Ligar Depois"
  const handleConfirmarLigarDepois = async () => {
    if (!leadParaLigarDepois || !dataAgendamento || !horarioAgendamento || !user) {
      toast({
        title: "Data e horário obrigatórios",
        description: "Por favor, selecione uma data e horário para ligar depois.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Combinar data e horário
      const [hours, minutes] = horarioAgendamento.split(':');
      const dataCompleta = new Date(dataAgendamento);
      dataCompleta.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // 1. Atualizar a etapa do lead para "Ligar Depois" e salvar data_callback e observações
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          etapa: "Ligar Depois" as Database["public"]["Enums"]["etapa_funil"],
          data_callback: dataAgendamento.toISOString().split('T')[0], // Salva apenas a data
          observacoes: observacoesAgendamento || leadParaLigarDepois.observacoes // Mantém observações existentes se não houver novas
        })
        .eq('id', leadParaLigarDepois.id);

      if (leadError) throw leadError;

      // 2. Criar o agendamento e sincronizar com Google Calendar automaticamente
      const { data: agendamentoData, error: agendamentoError } = await supabase
        .from('agendamentos_ligacoes')
        .insert({
          user_id: user.id,
          lead_id: leadParaLigarDepois.id,
          data_agendamento: dataCompleta.toISOString(),
          observacoes: observacoesAgendamento || null,
          status: 'pendente'
        })
        .select()
        .single();

      if (agendamentoError) throw agendamentoError;

      // 3. Sincronizar com Google Calendar se conectado
      if (googleCalendar.isConnected && agendamentoData) {
        googleCalendar.syncAgendamento(agendamentoData.id);
      }

      // 4. Atualizar estado local
      setLeads(prev => prev.map(lead => 
        lead.id === leadParaLigarDepois.id 
          ? { 
              ...lead, 
              etapa: "Ligar Depois" as Database["public"]["Enums"]["etapa_funil"],
              data_callback: dataAgendamento.toISOString().split('T')[0],
              observacoes: observacoesAgendamento || lead.observacoes
            }
          : lead
      ));

      toast({
        title: "✅ Agendado com sucesso!",
        description: `Ligação para ${leadParaLigarDepois.nome} agendada para ${format(dataCompleta, "dd/MM/yyyy 'às' HH:mm")}${googleCalendar.isConnected ? ' e sincronizado com Google Calendar!' : ''}`,
      });

      // 5. Manter as informações no popup (não resetar)
      // Apenas fechar o popup após um pequeno delay para o usuário ver o sucesso
      setTimeout(() => {
        setShowLigarDepoisDialog(false);
        setLeadParaLigarDepois(null);
        setDataAgendamento(undefined);
        setHorarioAgendamento("");
        setObservacoesAgendamento("");
      }, 1500);

    } catch (error) {
      console.error('Erro ao processar "Ligar Depois":', error);
      toast({
        title: "Erro",
        description: "Não foi possível agendar a ligação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Buscar histórico de ligações quando um lead é selecionado
  useEffect(() => {
    if (selectedLead && user) {
      fetchLigacoesHistorico(selectedLead.id);
    }
  }, [selectedLead, user]);

  const fetchLigacoesHistorico = async (leadId: string) => {
    setLoadingHistorico(true);
    try {
      const { data, error } = await supabase
        .from('ligacoes_historico')
        .select('*')
        .eq('lead_id', leadId)
        .eq('user_id', user?.id)
        .order('data_ligacao', { ascending: false });

      if (error) throw error;
      setLigacoesHistorico(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico de ligações:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const registrarLigacao = async (leadId: string, tipo: string = 'whatsapp') => {
    if (!user) return;

    console.log('🔄 Registrando ligação:', { leadId, tipo, userId: user.id });

    try {
      const { data, error } = await supabase
        .from('ligacoes_historico')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          tipo: tipo,
          data_ligacao: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error('❌ Erro ao registrar ligação:', error);
        throw error;
      }
      
      console.log('✅ Ligação registrada com sucesso:', data);
      
      // Atualizar o histórico imediatamente
      await fetchLigacoesHistorico(leadId);
      
      console.log('🔄 Histórico de ligações atualizado');
    } catch (error) {
      console.error('💥 Erro ao registrar ligação:', error);
    }
  };

  const atualizarLigacao = async (ligacaoId: string, novoTipo: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ligacoes_historico')
        .update({ tipo: novoTipo })
        .eq('id', ligacaoId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Atualizar o histórico imediatamente
      if (selectedLead) {
        await fetchLigacoesHistorico(selectedLead.id);
      }
      setEditingLigacao(null);
      setNovoTipoLigacao({});
    } catch (error) {
      console.error('Erro ao atualizar ligação:', error);
    }
  };

  const excluirLigacao = async (ligacaoId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ligacoes_historico')
        .delete()
        .eq('id', ligacaoId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Atualizar o histórico imediatamente
      if (selectedLead) {
        await fetchLigacoesHistorico(selectedLead.id);
      }
      setLigacaoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir ligação:', error);
    }
  };

  const YesNoField = ({ label, value }: { label: string; value: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex space-x-2">
        <Badge variant={!value ? "destructive" : "outline"} className="text-xs">
          ❌ Não
        </Badge>
        <Badge variant={value ? "default" : "outline"} className="text-xs">
          ✅ Sim
        </Badge>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
        

        <div className="flex-1 overflow-hidden relative">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-80">
                  <GlassProgressBar progress={70} />
                  <div className="mt-2 text-center text-sm text-muted-foreground">Carregando leads...</div>
                </div>
              </div>
            ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-2 sm:gap-4 min-w-max">
                {stages.map((stage) => {
                  const stageLeads = getLeadsByStage(stage.name);
                  const isSelectionActive = isGlobalSelectionMode;
                  
                  return (
                    <DroppableColumn key={stage.name} id={stage.name}>
                      <div className={`w-64 sm:w-72 lg:w-80 flex-shrink-0 rounded-2xl border backdrop-blur-md shadow-xl transition-all duration-300 hover:shadow-2xl ${
                        isTablet 
                          ? 'border-white/20 bg-white/5 text-white hover:shadow-white/10 hover:bg-white/10' 
                          : 'border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 text-card-foreground hover:shadow-white/5'
                      }`}>
                        <div className="flex flex-col space-y-1.5 p-6">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-2xl font-inter font-normal leading-none tracking-tighter truncate ${isTablet ? 'text-white' : ''}`}>{stage.label}</h3>
                            <Badge variant="secondary" className={`text-xs ${isTablet ? 'bg-white/10 text-white border-white/20' : ''}`}>{stageLeads.length}</Badge>
                          </div>
                          <div className={`w-full h-1 rounded-full ${stage.color}`} />
                          {stageLeads.length > 0 && (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className={`h-6 w-6 p-0 rounded-full shadow-sm border-0 transition-all duration-200 hover:scale-105 ${
                                  isTablet ? 'bg-[#d4ff4a] hover:bg-[#c9f035] text-black' : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                                onClick={() => setStageToInclude(stage.name)}
                                title="Enviar toda a etapa para o SitPlan"
                              >
                                <Users className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                className={`h-6 w-6 p-0 rounded-full shadow-sm border-0 transition-all duration-200 hover:scale-105 ${
                                  isGlobalSelectionMode 
                                    ? isTablet ? "bg-[#d4ff4a] text-black" : "bg-blue-600 text-white"
                                    : isTablet ? "bg-white/20 hover:bg-white/30 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                                onClick={() => {
                                  if (isGlobalSelectionMode) {
                                    multiSelect.clearSelections();
                                    setIsGlobalSelectionMode(false);
                                  } else {
                                    setIsGlobalSelectionMode(true);
                                    multiSelect.clearSelections();
                                  }
                                }}
                                title="Selecionar leads de todas as etapas"
                              >
                                <CheckSquare className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="p-6 pt-0 space-y-2 sm:space-y-3 h-[400px] sm:h-[500px] lg:h-[600px] overflow-y-auto">
                          {stageLeads.map((lead) => (
                            <DraggableLeadCard
                              key={lead.id}
                              lead={lead}
                              onClick={() => setSelectedLead(lead)}
                              isSelectionMode={isSelectionActive}
                              isSelected={multiSelect.isSelected(lead.id)}
                              onToggleSelection={multiSelect.toggleSelection}
                              stageName={stage.name}
                              isTabletMode={isTablet}
                            />
                          ))}
                          {stageLeads.length === 0 && (
                            <div className={`text-center text-xs sm:text-sm py-6 sm:py-8 ${isTablet ? 'text-white/50' : 'text-muted-foreground'}`}>
                              Nenhum lead nesta etapa
                            </div>
                          )}
                        </div>
                      </div>
                    </DroppableColumn>
                  );
                })}
              </div>
            </div>
            )}
            
            <DragOverlay>
            {activeId ? (
              <div className={`p-3 rounded-lg shadow-lg ring-2 opacity-90 ${
                isTablet 
                  ? 'bg-white/10 backdrop-blur-md ring-[#d4ff4a] text-white' 
                  : 'bg-muted/50 ring-primary'
              }`}>
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={isTablet ? 'bg-white/10 text-white' : ''}>
                      {leads.find(l => l.id === activeId)?.nome.split(' ').map((n: string) => n[0]).join('') || 'LD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isTablet ? 'text-white' : ''}`}>Movendo...</p>
                    <p className={`text-xs ${isTablet ? 'text-white/60' : 'text-muted-foreground'}`}>
                      {leads.find(l => l.id === activeId)?.nome || 'Lead'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            </DragOverlay>
          </DndContext>

          {/* Fixed Action Bar - Modo Seleção */}
          {isGlobalSelectionMode && multiSelect.selectedCount > 0 && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className={`flex items-center gap-3 p-4 backdrop-blur-md rounded-xl shadow-xl ${
                isTablet 
                  ? 'bg-white/10 border border-white/20' 
                  : 'bg-card/95 border-2 border-primary/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isTablet ? 'bg-[#d4ff4a]' : 'bg-primary'}`}></div>
                  <Badge variant="secondary" className={`text-base font-semibold ${isTablet ? 'bg-white/10 text-white border-white/20' : ''}`}>
                    {multiSelect.selectedCount} lead{multiSelect.selectedCount !== 1 ? 's' : ''} selecionado{multiSelect.selectedCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      multiSelect.clearSelections();
                      setIsGlobalSelectionMode(false);
                    }}
                    className={`h-8 ${isTablet ? 'border-white/30 text-white hover:bg-white/10' : ''}`}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={multiSelect.confirmSelection}
                    className={`h-8 rounded-full px-4 font-inter font-light transition-colors ${
                      isTablet 
                        ? 'bg-[#d4ff4a] text-black hover:bg-[#c9f035]' 
                        : 'bg-black text-white hover:bg-black/80'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Incluir ({multiSelect.selectedCount})
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog for sending all stage leads */}
        <AlertDialog open={!!stageToInclude} onOpenChange={() => setStageToInclude(null)}>
          <AlertDialogContent className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-inter font-normal tracking-tighter text-lg sm:text-xl">Confirmar Inclusão da Etapa</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-500">
                Tem certeza que deseja incluir todos os {getLeadsByStage(stageToInclude || '').length} leads da etapa "{stageToInclude}" no SitPlan?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="w-full sm:w-auto rounded-full px-6 py-3 font-inter font-light bg-transparent border border-border/30 text-foreground hover:bg-white/10 transition-colors">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (stageToInclude) {
                    handleIncludeAllStage(stageToInclude);
                  }
                }}
                className="w-full sm:w-auto rounded-full px-6 py-3 font-inter font-light bg-black text-white hover:bg-black/80 transition-colors"
              >
                Incluir Todos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog com informações detalhadas do lead */}
        <Dialog open={!!selectedLead} onOpenChange={() => {
          setSelectedLead(null);
          setEditingLead(null);
        }}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0">
              <ScrollArea className="max-h-[80vh] w-full">
              <div className="p-4 sm:p-6">
              <DialogHeader className="space-y-2 sm:space-y-3">
                <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="text-center sm:text-left">
                    <p className="text-lg sm:text-xl font-inter font-normal tracking-tighter">{selectedLead?.nome}</p>
                    <p className="text-sm sm:text-base text-black font-inter tracking-tighter">Recomendação</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

            {selectedLead && (
              <div className="space-y-4 sm:space-y-6">
                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <OutlineButton
                    onClick={() => {
                      registrarLigacao(selectedLead.id, 'whatsapp');
                      if (selectedLead.telefone) {
                        const phoneNumber = selectedLead.telefone.replace(/\D/g, '');
                        window.open(`https://wa.me/55${phoneNumber}`, '_blank');
                      }
                    }}
                    className="w-full sm:w-auto bg-[#25D366] text-white border-transparent hover:bg-[#20BA5A] hover:border-transparent"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="ml-2">WhatsApp</span>
                  </OutlineButton>
                  <OutlineButton
                    className={`w-full sm:w-auto ${isTablet ? 'text-white' : ''}`}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🎯 Botão separado "Incluir no Próximo Sit Plan" clicado');
                      
                      if (!selectedLead?.id) {
                        console.error('❌ Erro: selectedLead não existe');
                        toast({
                          title: "Erro",
                          description: "Lead não encontrado.",
                          variant: "destructive"
                        });
                        return;
                      }

                      try {
                        console.log('💾 Salvando no banco...');
                        const { data, error } = await supabase
                          .from('leads')
                          .update({
                            incluir_sitplan: true,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', selectedLead.id)
                          .select();

                        if (error) {
                          console.error('❌ Erro ao salvar:', error);
                          toast({
                            title: "Erro ao salvar",
                            description: "Não foi possível salvar as alterações.",
                            variant: "destructive"
                          });
                          return;
                        }

                        console.log('✅ Salvo no banco:', data);
                        console.log('✅ Lead marcado para SitPlan no banco de dados');

                        setLeads(prevLeads => 
                          prevLeads.map(lead => 
                            lead.id === selectedLead.id 
                              ? { ...lead, incluir_sitplan: true }
                              : lead
                          )
                        );

                        toast({
                          title: "Lead incluído!",
                          description: "Lead adicionado ao próximo SitPlan com sucesso.",
                        });

                        setSelectedLead(null);
                        setEditingLead(null);
                        
                      } catch (error) {
                        console.error('💥 Erro inesperado:', error);
                        toast({
                          title: "Erro",
                          description: "Ocorreu um erro inesperado.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span className="ml-2">Incluir no Próximo Sit Plan</span>
                  </OutlineButton>
                </div>

                {/* Dados Principais - Container Liquid Glass */}
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 p-6 space-y-4">
                  <h3 className={`text-2xl font-inter font-normal leading-none tracking-tighter ${isTablet ? 'text-white' : ''}`}>
                    Dados Principais
                  </h3>
                  
                  {/* Grid com Nome e Recomendante */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Nome</Label>
                      <p className={`font-semibold ${isTablet ? 'text-white' : ''}`}>{selectedLead.nome}</p>
                    </div>
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Recomendante(s)</Label>
                      <p className={`font-semibold ${isTablet ? 'text-white' : ''}`}>
                        {selectedLead.recomendante && selectedLead.recomendante.length > 0 
                          ? selectedLead.recomendante.join(', ')
                          : 'Nenhum recomendante'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Etapa Funil */}
                  <div>
                    <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Etapa Funil *</Label>
                    <Select 
                      value={editingLead?.etapa || selectedLead.etapa}
                      onValueChange={(value) => {
                        const updatedLead = { ...(editingLead || selectedLead), etapa: value as Database["public"]["Enums"]["etapa_funil"] };
                        setEditingLead(updatedLead);
                      }}
                    >
                      <SelectTrigger className="rounded-2xl border border-border/40 dark:border-white/30 bg-border/10 dark:bg-white/10 backdrop-blur-md px-3 py-2 text-sm font-inter tracking-tighter text-foreground shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 transition-all duration-300 hover:bg-border/15 dark:hover:bg-white/15">
                        <SelectValue>
                          {(editingLead?.etapa || selectedLead.etapa) && (
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${stages.find(s => s.name === (editingLead?.etapa || selectedLead.etapa))?.color}`}>
                              {stages.find(s => s.name === (editingLead?.etapa || selectedLead.etapa))?.label}
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl text-white shadow-2xl">
                        {stages.map((stage) => (
                          <SelectItem 
                            key={stage.name} 
                            value={stage.name}
                            className="focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 text-white"
                          >
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${stage.color}`}>
                              {stage.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                 {/* Agendamento com Data + Hora */}
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex flex-col space-y-1.5">
                      <h3 className={`text-2xl font-inter font-normal leading-none tracking-tighter ${isTablet ? 'text-white' : ''}`}>Agendamento</h3>
                      <p className={`text-sm ${isTablet ? 'text-white/70' : 'text-black'}`}>Selecione a data e horário</p>
                    </div>
                    {agendamentoMaisRecente && (
                      <Badge variant="secondary" className="text-xs">Criado no TA</Badge>
                    )}
                  </div>
                  <div className="p-6 pt-0 space-y-4">
                    <div>
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: 6 }).map((_, idx) => {
                          const dayDate = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), idx + 1);
                          const dayNum = format(dayDate, 'd');
                          const weekLabelRaw = format(dayDate, 'EEE', { locale: ptBR });
                          const weekLabel = weekLabelRaw.charAt(0).toUpperCase() + weekLabelRaw.slice(1);
                          const isSelected = (editingLead?.data_callback || selectedLead.data_callback)?.startsWith(format(dayDate, 'yyyy-MM-dd'));
                          return (
                            <div
                              key={`${dayNum}-${weekLabel}`}
                              className={`text-center p-3 rounded-2xl ${isSelected ? 'bg-black text-white' : isTablet ? 'bg-white/10 text-white/60' : 'bg-white/50 text-black/60'}`}
                              onClick={() => {
                                const dateStr = format(dayDate, 'yyyy-MM-dd');
                                const currentTime = editingLead?.hora_callback || selectedLead.hora_callback || '09:00';
                                const updatedLead = {
                                  ...(editingLead || selectedLead),
                                  data_callback: `${dateStr}T${currentTime}:00`,
                                  hora_callback: currentTime,
                                };
                                setEditingLead(updatedLead);
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className={`font-medium ${isTablet && !isSelected ? 'text-white' : ''}`}>{dayNum}</div>
                              <div className={`text-xs font-light mt-1 ${isTablet && !isSelected ? 'text-white/60' : ''}`}>{weekLabel}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end mt-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="rounded-full p-2 bg-white/20 backdrop-blur-md border border-white/30 text-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/30 hover:shadow-2xl active:scale-95"
                              aria-label="Abrir calendário"
                            >
                              <CalendarIcon className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={(editingLead?.data_callback || selectedLead.data_callback) ? new Date((editingLead?.data_callback || selectedLead.data_callback || '').split('T')[0]) : undefined}
                              onSelect={(date) => {
                                if (!date) return;
                                const currentTime = editingLead?.hora_callback || selectedLead.hora_callback || '09:00';
                                const dateStr = format(date, 'yyyy-MM-dd');
                                const updatedLead = {
                                  ...(editingLead || selectedLead),
                                  data_callback: `${dateStr}T${currentTime}:00`,
                                  hora_callback: currentTime,
                                };
                                setEditingLead(updatedLead);
                              }}
                              locale={ptBR}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                              classNames={{
                                day_selected:
                                  "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white",
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div>
                      <Label className={`text-xs ${isTablet ? 'text-white' : 'text-black'}`}>Horário</Label>
                      <select
                        value={editingLead?.hora_callback || selectedLead.hora_callback || ''}
                        onChange={(e) => {
                          const currentDate = (editingLead?.data_callback || selectedLead.data_callback || new Date().toISOString()).split('T')[0];
                          const updatedLead = {
                            ...(editingLead || selectedLead),
                            data_callback: `${currentDate}T${e.target.value}:00`,
                            hora_callback: e.target.value,
                          };
                          setEditingLead(updatedLead);
                        }}
                        className="w-full h-10 rounded-2xl border border-border/40 dark:border-white/30 bg-border/10 dark:bg-white/10 backdrop-blur-md px-3 text-sm font-inter tracking-tighter text-foreground shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 transition-all duration-300 hover:bg-border/15 dark:hover:bg-white/15"
                      >
                        <option value="">Selecione</option>
                        {[
                          '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                          '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                          '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                          '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
                        ].map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    {(editingLead?.data_callback || selectedLead.data_callback) && (
                      <div className={`flex items-center gap-2 text-xs ${isTablet ? 'text-white/70' : 'text-black'}`}>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Será sincronizado com Google Calendar ao salvar</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção: Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className={`text-sm font-semibold ${isTablet ? 'text-white border-white/20' : 'text-black'} border-b pb-2`}>Dados Pessoais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Celular Principal</Label>
                      <div className="flex items-center space-x-2">
                        <LiquidGlassInput value={selectedLead.telefone || ""} readOnly className="flex-1" />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            registrarLigacao(selectedLead.id, 'whatsapp');
                            if (selectedLead.telefone) {
                              const phoneNumber = selectedLead.telefone.replace(/\D/g, '');
                              window.open(`https://wa.me/55${phoneNumber}`, '_blank');
                            }
                          }}
                          className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/30 hover:shadow-2xl active:scale-95"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            registrarLigacao(selectedLead.id, 'telefone');
                            if (selectedLead.telefone) {
                              window.open(`tel:${selectedLead.telefone}`, '_self');
                            }
                          }}
                          className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/30 hover:shadow-2xl active:scale-95"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Celular Secundário</Label>
                      <LiquidGlassInput 
                        value={editingLead?.celular_secundario || selectedLead.celular_secundario || ""} 
                        onChange={(e) => {
                          const updatedLead = { ...(editingLead || selectedLead), celular_secundario: e.target.value };
                          setEditingLead(updatedLead);
                        }}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Email</Label>
                      <LiquidGlassInput 
                        type="email"
                        value={editingLead?.email || selectedLead.email || ""} 
                        onChange={(e) => {
                          const updatedLead = { ...(editingLead || selectedLead), email: e.target.value };
                          setEditingLead(updatedLead);
                        }}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Idade</Label>
                      <LiquidGlassInput 
                        type="number"
                        value={editingLead?.idade || selectedLead.idade || ""} 
                        onChange={(e) => {
                          const updatedLead = { ...(editingLead || selectedLead), idade: parseInt(e.target.value) || null };
                          setEditingLead(updatedLead);
                        }}
                        placeholder="30"
                        min="0"
                        max="120"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Data de Nascimento</Label>
                      <LiquidGlassInput 
                        type="date" 
                        value={editingLead?.data_nascimento || selectedLead.data_nascimento || ""}
                        onChange={(e) => {
                          const updatedLead = { ...(editingLead || selectedLead), data_nascimento: e.target.value };
                          setEditingLead(updatedLead);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Profissão</Label>
                      <ProfissaoCombobox
                        value={editingLead?.profissao || selectedLead.profissao || ""}
                        onValueChange={(value) => {
                          const updatedLead = { ...(editingLead || selectedLead), profissao: value };
                          setEditingLead(updatedLead);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Renda Estimada</Label>
                      <LiquidGlassInput 
                        value={editingLead?.renda_estimada || selectedLead.renda_estimada || ""} 
                        onChange={(e) => {
                          const updatedLead = { ...(editingLead || selectedLead), renda_estimada: e.target.value };
                          setEditingLead(updatedLead);
                        }}
                        placeholder="R$ 5.000,00"
                      />
                    </div>
                    
                    <div>
                      <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Cidade</Label>
                      <LiquidGlassInput 
                        value={editingLead?.cidade || selectedLead.cidade || ""} 
                        onChange={(e) => {
                          const updatedLead = { ...(editingLead || selectedLead), cidade: e.target.value };
                          setEditingLead(updatedLead);
                        }}
                        placeholder="São Paulo - SP"
                      />
                    </div>
                  </div>
                </div>

                {/* Campos Yes/No */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>HighTicket</span>
                    <CheckedSwitch
                      checked={!!(editingLead?.high_ticket ?? selectedLead.high_ticket)}
                      onChange={(value) => {
                        const updatedLead = { ...(editingLead || selectedLead), high_ticket: value };
                        setEditingLead(updatedLead);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Casado(a)</span>
                    <CheckedSwitch
                      checked={!!(editingLead?.casado ?? selectedLead.casado)}
                      onChange={(value) => {
                        const updatedLead = { ...(editingLead || selectedLead), casado: value };
                        setEditingLead(updatedLead);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Filhos</span>
                    <CheckedSwitch
                      checked={!!(editingLead?.tem_filhos ?? selectedLead.tem_filhos)}
                      onChange={(value) => {
                        const updatedLead = { ...(editingLead || selectedLead), tem_filhos: value, quantidade_filhos: value ? (editingLead?.quantidade_filhos ?? selectedLead.quantidade_filhos ?? null) : null };
                        setEditingLead(updatedLead);
                      }}
                    />
                  </div>
                  
                  {/* Campo condicional: Quantidade de Filhos */}
                  {(editingLead?.tem_filhos || selectedLead.tem_filhos) && (
                    <div className="flex items-center justify-between py-2 border-b bg-muted/30 px-3 rounded">
                      <span className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Quantidade de filhos</span>
                      <LiquidGlassInput 
                        type="number"
                        min="1"
                        max="20"
                        value={editingLead?.quantidade_filhos || selectedLead.quantidade_filhos || ""} 
                        onChange={(e) => {
                          const updatedLead = { 
                            ...(editingLead || selectedLead), 
                            quantidade_filhos: parseInt(e.target.value) || null 
                          };
                          setEditingLead(updatedLead);
                        }}
                        placeholder="Ex: 2"
                        className="max-w-[100px]"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Avisado</span>
                    <CheckedSwitch
                      checked={!!(editingLead?.avisado ?? selectedLead.avisado)}
                      onChange={(value) => {
                        const updatedLead = { ...(editingLead || selectedLead), avisado: value };
                        setEditingLead(updatedLead);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Incluir no SitPlan?</span>
                    <CheckedSwitch
                      checked={!!(editingLead?.incluir_sitplan ?? selectedLead.incluir_sitplan)}
                      onChange={async (value) => {
                        if (!value) {
                          console.log('🎯 Removendo do SitPlan...');
                          try {
                            // Save to database
                            const { error } = await supabase
                              .from('leads')
                              .update({
                                incluir_sitplan: false,
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', selectedLead.id);

                            if (error) {
                              console.error('❌ Erro ao salvar:', error);
                              toast({
                                title: "Erro",
                                description: "Não foi possível salvar as alterações.",
                                variant: "destructive"
                              });
                              return;
                            }

                            // Database state is the single source of truth for SitPlan selections
                            console.log('✅ Lead removido do SitPlan no banco de dados');

                            // Update local state
                            setLeads(prevLeads => 
                              prevLeads.map(lead => 
                                lead.id === selectedLead.id 
                                  ? { ...lead, incluir_sitplan: false }
                                  : lead
                              )
                            );

                            const updatedLead = { ...(editingLead || selectedLead), incluir_sitplan: false };
                            setEditingLead(updatedLead);

                            toast({
                              title: "Removido do SitPlan",
                              description: "Lead removido do próximo SitPlan."
                            });
                          } catch (error) {
                            console.error('💥 Erro inesperado:', error);
                          }
                        } else {
                          console.log('🔥 BOTÃO SIM CLICADO! selectedLead:', selectedLead);
                          console.log('🎯 Incluindo no SitPlan - selectedLead:', selectedLead?.id);
                          
                          if (!selectedLead?.id) {
                            console.error('❌ Erro: selectedLead ou selectedLead.id não existe');
                            toast({
                              title: "Erro",
                              description: "Lead não encontrado.",
                              variant: "destructive"
                            });
                            return;
                          }

                          try {
                            // Save to database first
                            console.log('💾 Salvando no banco...');
                            const { data, error } = await supabase
                              .from('leads')
                              .update({
                                incluir_sitplan: true,
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', selectedLead.id)
                              .select();

                            if (error) {
                              console.error('❌ Erro ao salvar:', error);
                              toast({
                                title: "Erro ao salvar",
                                description: "Não foi possível salvar as alterações.",
                                variant: "destructive"
                              });
                              return;
                            }

                            console.log('✅ Salvo no banco:', data);

                            // Database state is the single source of truth for SitPlan selections
                            console.log('✅ Lead marcado para SitPlan no banco de dados');

                            // Update local state
                            setLeads(prevLeads => 
                              prevLeads.map(lead => 
                                lead.id === selectedLead.id 
                                  ? { ...lead, incluir_sitplan: true }
                                  : lead
                              )
                            );

                            const updatedLead = { ...(editingLead || selectedLead), incluir_sitplan: true };
                            setEditingLead(updatedLead);

                            toast({
                              title: "Lead incluído!",
                              description: "Lead adicionado ao próximo SitPlan com sucesso.",
                            });

                            // Close modal
                            setSelectedLead(null);
                            setEditingLead(null);
                            
                          } catch (error) {
                            console.error('💥 Erro inesperado:', error);
                            toast({
                              title: "Erro",
                              description: "Ocorreu um erro inesperado.",
                              variant: "destructive"
                            });
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Histórico de Ligações */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'} flex items-center gap-2`}>
                      <Clock className="w-4 h-4" />
                      Histórico de Ligações
                    </Label>
                    <Badge variant="outline" className={isTablet ? 'bg-white/10 text-white border-white/20' : ''}>
                      {ligacoesHistorico.length} {ligacoesHistorico.length === 1 ? 'ligação' : 'ligações'}
                    </Badge>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {loadingHistorico ? (
                      <div className={`p-4 text-center text-sm ${isTablet ? 'text-white/70' : 'text-black'}`}>
                        Carregando histórico...
                      </div>
                     ) : ligacoesHistorico.length > 0 ? (
                       <div className="space-y-2 p-3">
                         {ligacoesHistorico.map((ligacao) => (
                           <div key={ligacao.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm group hover:bg-muted/50 transition-colors">
                             <div className="flex items-center gap-2 flex-1">
                               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                               {editingLigacao === ligacao.id ? (
                                 <div className="flex items-center gap-2">
                                   <Select
                                     value={novoTipoLigacao[ligacao.id] || ligacao.tipo}
                                     onValueChange={(value) => {
                                       setNovoTipoLigacao({
                                         ...novoTipoLigacao,
                                         [ligacao.id]: value
                                       });
                                     }}
                                   >
                                     <SelectTrigger className="w-32 h-7">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                       <SelectItem value="telefone">Telefone</SelectItem>
                                       <SelectItem value="email">Email</SelectItem>
                                       <SelectItem value="pessoal">Pessoal</SelectItem>
                                     </SelectContent>
                                   </Select>
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     className="h-7 w-7 p-0"
                                     onClick={() => atualizarLigacao(ligacao.id, novoTipoLigacao[ligacao.id] || ligacao.tipo)}
                                   >
                                     <Check className="w-3 h-3" />
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     className="h-7 w-7 p-0"
                                     onClick={() => {
                                       setEditingLigacao(null);
                                       setNovoTipoLigacao({});
                                     }}
                                   >
                                     <X className="w-3 h-3" />
                                   </Button>
                                 </div>
                               ) : (
                                 <span className="capitalize">{ligacao.tipo}</span>
                               )}
                             </div>
                             
                             <div className="flex items-center gap-2">
                               <span className={`${isTablet ? 'text-white/70' : 'text-black'} text-xs`}>
                                 {new Date(ligacao.data_ligacao).toLocaleString('pt-BR', {
                                   day: '2-digit',
                                   month: '2-digit',
                                   year: 'numeric',
                                   hour: '2-digit',
                                   minute: '2-digit'
                                 })}
                               </span>
                               
                               {editingLigacao !== ligacao.id && (
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     className="h-6 w-6 p-0"
                                     onClick={() => {
                                       setEditingLigacao(ligacao.id);
                                       setNovoTipoLigacao({ [ligacao.id]: ligacao.tipo });
                                     }}
                                   >
                                     <Edit2 className="w-3 h-3" />
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                     onClick={() => setLigacaoParaExcluir(ligacao)}
                                   >
                                     <Trash2 className="w-3 h-3" />
                                   </Button>
                                 </div>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                    ) : (
                      <div className={`p-4 text-center text-sm ${isTablet ? 'text-white/70' : 'text-black'}`}>
                        Nenhuma ligação registrada ainda
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>Observações</Label>
                  <LiquidGlassTextarea 
                    value={editingLead?.observacoes || selectedLead.observacoes || ""} 
                    onChange={(e) => {
                      const updatedLead = { ...(editingLead || selectedLead), observacoes: e.target.value };
                      setEditingLead(updatedLead);
                    }}
                    placeholder="Adicione observações sobre o lead..."
                    className="mt-1"
                  />
                </div>

                {/* PA Estimado */}
                <div>
                  <Label className={`text-sm ${isTablet ? 'text-white' : 'text-black'}`}>PA Estimado</Label>
                  <LiquidGlassInput 
                    value={editingLead?.pa_estimado || selectedLead.pa_estimado || ""} 
                    onChange={(e) => {
                      const updatedLead = { ...(editingLead || selectedLead), pa_estimado: e.target.value };
                      setEditingLead(updatedLead);
                    }}
                  />
                </div>

                {/* Histórico de Tempo em Etapas */}
                <div className="mt-6">
                  <StageTimeHistory leadId={selectedLead.id} showLeadName={false} limit={15} />
                </div>

                {/* Histórico de Etapas */}
                <div className="mt-6">
                  <LeadHistory leadId={selectedLead.id} />
                </div>

                {/* Botão Salvar */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      setSelectedLead(null);
                      setEditingLead(null);
                    }}
                    className="w-full sm:w-auto rounded-full px-6 py-3 font-inter font-light bg-transparent border border-border/30 text-foreground hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveLead}
                    disabled={saving || !editingLead}
                    className="w-full sm:w-auto rounded-full px-6 py-3 font-inter font-light bg-black text-white hover:bg-black/80 transition-colors"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            )}
              </div>
              </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Dialog para agendar "Ligar Depois" */}
        <Dialog open={showLigarDepoisDialog} onOpenChange={setShowLigarDepoisDialog}>
          <DialogContent className="max-w-sm sm:max-w-md border-0 shadow-xl">
            <DialogHeader className="text-center pb-4">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">
                Agendar Ligação
              </DialogTitle>
              <DialogDescription className={`text-xs sm:text-sm ${isTablet ? 'text-white/70' : 'text-black'}`}>
                Selecione uma data para agendar a ligação com este lead
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              {leadParaLigarDepois && (
                <div className="text-center">
                  <p className={`text-xs sm:text-sm ${isTablet ? 'text-white/70' : 'text-black'}`}>Lead:</p>
                  <p className="font-medium text-base sm:text-lg truncate">{leadParaLigarDepois.nome}</p>
                </div>
              )}
              
              <div className="space-y-2 sm:space-y-3">
                <Label className={`text-xs sm:text-sm font-medium ${isTablet ? 'text-white' : 'text-black'}`}>
                  Data *
                </Label>
                
                <LiquidGlassInput
                  type="date"
                  value={dataAgendamento ? format(dataAgendamento, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    // Parse a string no formato yyyy-MM-dd e cria uma data local
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setDataAgendamento(new Date(year, month - 1, day));
                  } else {
                    setDataAgendamento(undefined);
                  }
                }}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="w-full h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl transition-all duration-200 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className={`text-xs sm:text-sm font-medium ${isTablet ? 'text-white' : 'text-black'}`}>
                  Horário *
                </Label>
                <select
                  value={horarioAgendamento}
                  onChange={(e) => setHorarioAgendamento(e.target.value)}
                  className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl border-2 bg-background px-3 transition-all duration-200 focus:border-primary/50"
                >
                  <option value="">Selecione um horário</option>
                  {[
                    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
                    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
                    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                    "17:00", "17:30", "18:00"
                  ].map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="observacoes-agendamento" className={`text-xs sm:text-sm font-medium ${isTablet ? 'text-white' : 'text-black'}`}>
                  Observações
                </Label>
                <LiquidGlassTextarea
                  id="observacoes-agendamento"
                  placeholder="Adicione observações sobre o agendamento..."
                  value={observacoesAgendamento}
                  onChange={(e) => setObservacoesAgendamento(e.target.value)}
                  rows={3}
                  className="border-2 rounded-lg sm:rounded-xl focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLigarDepoisDialog(false);
                    setLeadParaLigarDepois(null);
                    setDataAgendamento(undefined);
                    setHorarioAgendamento("");
                    setObservacoesAgendamento("");
                  }}
                  className="w-full sm:flex-1 h-10 sm:h-12 rounded-lg sm:rounded-xl border-2 hover:bg-muted/50 transition-all duration-200"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarLigarDepois}
                  disabled={!dataAgendamento || !horarioAgendamento}
                  className="w-full sm:flex-1 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agendar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação para exclusão */}
        <AlertDialog open={!!ligacaoParaExcluir} onOpenChange={() => setLigacaoParaExcluir(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta ligação do histórico? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (ligacaoParaExcluir) {
                    excluirLigacao(ligacaoParaExcluir.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
