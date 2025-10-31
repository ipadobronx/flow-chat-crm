
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, MessageSquare, Calendar as CalendarIcon, ArrowRight, Clock, Edit2, Trash2, X, Check, Filter, CheckSquare, Square, Users, Plus, PlayCircle } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
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
import { AgendarLigacao } from "@/components/agendamento/AgendarLigacao";
import { Calendar } from "@/components/ui/calendar";
import { StageTimeHistory } from "@/components/dashboard/StageTimeHistory";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { updateLeadPartialSchema } from "@/lib/schemas";
import { globalRateLimiter } from "@/lib/validation";
import { z } from "zod";

const stages = [
  { name: "Todos", color: "bg-blue-500" },
  { name: "Novo", color: "bg-sky-500" },
  { name: "TA", color: "bg-purple-600" },
  { name: "Não atendido", color: "bg-red-600" },
  { name: "Ligar Depois", color: "bg-yellow-600" },
  { name: "Marcar", color: "bg-green-600" },
  { name: "OI", color: "bg-indigo-500" },
  { name: "Delay OI", color: "bg-yellow-500" },
  { name: "PC", color: "bg-orange-500" },
  { name: "Delay PC", color: "bg-red-500" },
  { name: "Analisando Proposta", color: "bg-orange-600" },
  { name: "N", color: "bg-purple-500" },
  { name: "Proposta Não Apresentada", color: "bg-gray-600" },
  { name: "Pendência de UW", color: "bg-yellow-700" },
  { name: "Apólice Emitida", color: "bg-green-500" },
  { name: "Apólice Entregue", color: "bg-emerald-500" },
  { name: "Delay C2", color: "bg-cyan-500" },
  { name: "Não", color: "bg-gray-500" },
  { name: "Proposta Cancelada", color: "bg-red-600" },
  { name: "Apólice Cancelada", color: "bg-red-700" }
] as const;

type Lead = {
  id: string;
  nome: string;
  empresa: string | null;
  valor: string | null;
  telefone: string | null;
  profissao: string | null;
  recomendante: string[] | null;
  etapa: Database["public"]["Enums"]["etapa_funil"];
  status: string | null;
  data_callback: string | null;
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
  stageName
}: { 
  lead: Lead; 
  onClick: () => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (leadId: string) => void;
  stageName: string;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isSelectionMode ? {} : listeners)}
      {...(isSelectionMode ? {} : attributes)}
      className={`p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all relative cursor-pointer group ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${isSelected ? 'ring-1 ring-blue-400/50 bg-blue-50/50' : ''}`}
      onClick={handleCardClick}
    >
      {/* Checkbox minimalista para multi-seleção */}
      {isSelectionMode && (
        <div className="absolute top-2 right-2 z-10">
          <div 
            className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
              isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-blue-300 hover:border-blue-400 bg-white'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleCheckboxChange(!isSelected);
            }}
          >
            {isSelected && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-start space-x-2 sm:space-x-3">
        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
          <AvatarFallback className="text-xs sm:text-sm">{lead.nome.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-start justify-between">
            <p className="font-medium text-xs sm:text-sm truncate flex-1">{lead.nome}</p>
            {/* Contagem de dias no canto superior direito */}
            {lead.etapa !== "Todos" && (
              <Badge className="ml-2 bg-blue-50 text-blue-600 border-blue-200 text-xs px-1.5 py-0.5 shrink-0">
                {lead.dias_na_etapa_atual || 1}d
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {lead.recomendante && Array.isArray(lead.recomendante) && lead.recomendante.length > 0 
              ? lead.recomendante.join(", ") 
              : "Sem recomendante"}
          </p>
          <p className="text-xs sm:text-sm font-semibold text-success mt-1">
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [showOnlySitplan, setShowOnlySitplan] = useState(false);
  const [isGlobalSelectionMode, setIsGlobalSelectionMode] = useState(false);
  const [stageToInclude, setStageToInclude] = useState<string | null>(null);
  
  // Estados para o popup de "Ligar Depois"
  const [showLigarDepoisDialog, setShowLigarDepoisDialog] = useState(false);
  const [leadParaLigarDepois, setLeadParaLigarDepois] = useState<Lead | null>(null);
  const [dataAgendamento, setDataAgendamento] = useState<Date | undefined>(undefined);
  const [horarioAgendamento, setHorarioAgendamento] = useState<string>("");
  const [observacoesAgendamento, setObservacoesAgendamento] = useState("");

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
          .select('id, nome, empresa, valor, telefone, profissao, recomendante, etapa, status, data_callback, data_nascimento, high_ticket, casado, tem_filhos, quantidade_filhos, avisado, incluir_sitplan, observacoes, pa_estimado, data_sitplan, dias_na_etapa_atual')
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
          status: editingLead.status,
          data_callback: editingLead.data_callback,
          data_nascimento: editingLead.data_nascimento,
          observacoes: validatedData.observacoes,
          pa_estimado: validatedData.pa_estimado,
          data_sitplan: editingLead.data_sitplan,
          high_ticket: editingLead.high_ticket,
          casado: editingLead.casado,
          tem_filhos: editingLead.tem_filhos,
          quantidade_filhos: editingLead.quantidade_filhos,
          avisado: editingLead.avisado,
          incluir_sitplan: editingLead.incluir_sitplan,
        })
        .eq('id', editingLead.id);

      if (error) throw error;

      // Atualizar estado local
      setLeads(prev => prev.map(lead => 
        lead.id === editingLead.id ? editingLead : lead
       ));

       setSelectedLead(editingLead);
       
       // Invalidar cache do SitPlan se incluir_sitplan foi alterado
       if (editingLead.incluir_sitplan !== undefined) {
         queryClient.invalidateQueries({ queryKey: ["sitplan-selecionados"] });
         console.log('🔄 Cache do SitPlan invalidado - sincronização ativada');
       }

       toast({
         title: "Sucesso",
         description: "Lead atualizado com sucesso.",
       });
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
  }, [editingLead, user, toast]);

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
        <div className="flex-shrink-0 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Sales Pipeline</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Kanban board for lead management</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Label className="text-sm">Mostrar apenas leads do SitPlan</Label>
              <Switch
                checked={showOnlySitplan}
                onCheckedChange={(checked) => {
                  setShowOnlySitplan(checked);
                  if (checked) {
                    console.log('🔍 Filtro SitPlan ativado - mostrando apenas leads com incluir_sitplan = true');
                    const sitplanLeads = leads.filter(lead => lead.incluir_sitplan);
                    console.log(`📊 Total de leads marcados para SitPlan: ${sitplanLeads.length}`, 
                      sitplanLeads.map(lead => ({ nome: lead.nome, etapa: lead.etapa })));
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {loading ? (
              <div className="text-center py-8">Carregando leads...</div>
            ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-2 sm:gap-4 min-w-max">
                {stages.map((stage) => {
                  const stageLeads = getLeadsByStage(stage.name);
                  const isSelectionActive = isGlobalSelectionMode;
                  
                  return (
                    <DroppableColumn key={stage.name} id={stage.name}>
                      <Card className="w-64 sm:w-72 lg:w-80 flex-shrink-0">
                        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                           <div className="flex items-center justify-between">
                            <CardTitle className="text-xs sm:text-sm font-medium truncate">{stage.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                              
                              {/* Botões minimalistas estilo Safari */}
                              {stageLeads.length > 0 && (
                                <div className="flex gap-1.5">
                                  {/* Botão verde - Enviar todos os leads da etapa */}
                                  <Button
                                    size="sm"
                                    className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm border-0 transition-all duration-200 hover:scale-105"
                                    onClick={() => setStageToInclude(stage.name)}
                                    title="Enviar toda a etapa para o SitPlan"
                                  >
                                    <Users className="h-3 w-3" />
                                  </Button>
                                  
                                  {/* Botão azul - Ativar modo de seleção */}
                                  <Button
                                    size="sm"
                                    className={`h-6 w-6 p-0 rounded-full shadow-sm border-0 transition-all duration-200 hover:scale-105 ${
                                      isGlobalSelectionMode 
                                        ? "bg-blue-600 text-white" 
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
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
                          </div>
                          <div className={`w-full h-1 rounded-full ${stage.color}`} />
                        </CardHeader>
                        <CardContent className="space-y-2 sm:space-y-3 h-[400px] sm:h-[500px] lg:h-[600px] overflow-y-auto px-3 sm:px-6">
                          {stageLeads.map((lead) => (
                            <DraggableLeadCard
                              key={lead.id}
                              lead={lead}
                              onClick={() => setSelectedLead(lead)}
                              isSelectionMode={isSelectionActive}
                              isSelected={multiSelect.isSelected(lead.id)}
                              onToggleSelection={multiSelect.toggleSelection}
                              stageName={stage.name}
                            />
                          ))}
                          {stageLeads.length === 0 && (
                            <div className="text-center text-muted-foreground text-xs sm:text-sm py-6 sm:py-8">
                              Nenhum lead nesta etapa
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DroppableColumn>
                  );
                })}
              </div>
            </div>
            )}
            
            <DragOverlay>
            {activeId ? (
              <div className="p-3 rounded-lg bg-muted/50 shadow-lg ring-2 ring-primary opacity-90">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {leads.find(l => l.id === activeId)?.nome.split(' ').map((n: string) => n[0]).join('') || 'LD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Movendo...</p>
                    <p className="text-xs text-muted-foreground">
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
              <div className="flex items-center gap-3 p-4 bg-card/95 backdrop-blur-md border-2 border-primary/20 rounded-xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <Badge variant="secondary" className="text-base font-semibold">
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
                    className="h-8"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={multiSelect.confirmSelection}
                    className="bg-primary hover:bg-primary/90 shadow-md h-8"
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Inclusão da Etapa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja incluir todos os {getLeadsByStage(stageToInclude || '').length} leads da etapa "{stageToInclude}" no SitPlan?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (stageToInclude) {
                    handleIncludeAllStage(stageToInclude);
                  }
                }}
                className="bg-green-600 text-white hover:bg-green-700"
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
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="space-y-2 sm:space-y-3">
              <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto sm:mx-0">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedLead?.nome}`} />
                  <AvatarFallback className="text-xs sm:text-sm">{selectedLead?.nome?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-lg font-semibold">👤 {selectedLead?.nome}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Recomendação</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-4 sm:space-y-6">
                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    onClick={() => {
                      registrarLigacao(selectedLead.id, 'whatsapp');
                      // Aqui você pode adicionar a lógica para abrir o WhatsApp
                      if (selectedLead.telefone) {
                        const phoneNumber = selectedLead.telefone.replace(/\D/g, '');
                        window.open(`https://wa.me/55${phoneNumber}`, '_blank');
                      }
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full sm:w-auto"
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
                        // Save to database
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
                    }}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Incluir no Próximo Sit Plan
                  </Button>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Agendamento
                  </Button>
                </div>

                {/* Informações básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Nome</Label>
                    <p className="font-medium">{selectedLead.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Recomendante(s)</Label>
                    <p className="font-medium">
                      {selectedLead.recomendante && selectedLead.recomendante.length > 0 
                        ? selectedLead.recomendante.join(', ')
                        : 'Nenhum recomendante'
                      }
                    </p>
                  </div>
                </div>

                {/* Selects de etapa e status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Etapa Funil *</Label>
                    <Select 
                      value={editingLead?.etapa || selectedLead.etapa}
                      onValueChange={(value) => {
                        const updatedLead = { ...selectedLead, etapa: value as Database["public"]["Enums"]["etapa_funil"] };
                        setEditingLead(updatedLead);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.name} value={stage.name}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <Select 
                      value={editingLead?.status || selectedLead.status || ""}
                      onValueChange={(value) => {
                        const updatedLead = { ...selectedLead, status: value };
                        setEditingLead(updatedLead);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ligar Depois">⏰ Ligar Depois</SelectItem>
                        <SelectItem value="Aguardando Retorno">⏳ Aguardando Retorno</SelectItem>
                        <SelectItem value="Agendado">📅 Agendado</SelectItem>
                        <SelectItem value="Em Negociação">💼 Em Negociação</SelectItem>
                        <SelectItem value="Proposta Enviada">📧 Proposta Enviada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Data para ligar depois */}
                <div>
                  <Label className="text-sm text-muted-foreground">Ligar Depois</Label>
                  <Input 
                    type="date" 
                    value={editingLead?.data_callback || selectedLead.data_callback || ""}
                    onChange={(e) => {
                      const updatedLead = { ...selectedLead, data_callback: e.target.value };
                      setEditingLead(updatedLead);
                    }}
                  />
                </div>

                {/* Data de nascimento e Celular */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Data de Nascimento</Label>
                    <Input 
                      type="date" 
                      value={editingLead?.data_nascimento || selectedLead.data_nascimento || ""}
                      onChange={(e) => {
                        const updatedLead = { ...selectedLead, data_nascimento: e.target.value };
                        setEditingLead(updatedLead);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Celular</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={selectedLead.telefone || ""} readOnly className="flex-1" />
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
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Profissão */}
                <div>
                  <Label className="text-sm text-muted-foreground">Profissão</Label>
                  <Input value={selectedLead.profissao || ""} readOnly />
                </div>

                {/* Campos Yes/No */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">HighTicket</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={editingLead?.high_ticket === false || (!editingLead && !selectedLead.high_ticket) ? "destructive" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, high_ticket: false };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ❌ Não
                      </Button>
                      <Button
                        size="sm"
                        variant={editingLead?.high_ticket === true || (!editingLead && selectedLead.high_ticket) ? "default" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, high_ticket: true };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ✅ Sim
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Casado(a)</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={editingLead?.casado === false || (!editingLead && !selectedLead.casado) ? "destructive" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, casado: false };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ❌ Não
                      </Button>
                      <Button
                        size="sm"
                        variant={editingLead?.casado === true || (!editingLead && selectedLead.casado) ? "default" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, casado: true };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ✅ Sim
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Filhos</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={editingLead?.tem_filhos === false || (!editingLead && !selectedLead.tem_filhos) ? "destructive" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, tem_filhos: false };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ❌ Não
                      </Button>
                      <Button
                        size="sm"
                        variant={editingLead?.tem_filhos === true || (!editingLead && selectedLead.tem_filhos) ? "default" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, tem_filhos: true };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ✅ Sim
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Avisado</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={editingLead?.avisado === false || (!editingLead && !selectedLead.avisado) ? "destructive" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, avisado: false };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ❌ Não
                      </Button>
                      <Button
                        size="sm"
                        variant={editingLead?.avisado === true || (!editingLead && selectedLead.avisado) ? "default" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, avisado: true };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ✅ Sim
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Incluir no SitPlan?</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={editingLead?.incluir_sitplan === false || (!editingLead && !selectedLead.incluir_sitplan) ? "destructive" : "outline"}
                        onClick={async () => {
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

                            const updatedLead = { ...selectedLead, incluir_sitplan: false };
                            setEditingLead(updatedLead);

                            toast({
                              title: "Removido do SitPlan",
                              description: "Lead removido do próximo SitPlan."
                            });
                          } catch (error) {
                            console.error('💥 Erro inesperado:', error);
                          }
                        }}
                      >
                        ❌ Não
                      </Button>
                      <Button
                        size="sm"
                        variant={editingLead?.incluir_sitplan === true || (!editingLead && selectedLead.incluir_sitplan) ? "default" : "outline"}
                        onClick={async (e) => {
                          console.log('🔥 BOTÃO SIM CLICADO! selectedLead:', selectedLead);
                          e.preventDefault();
                          e.stopPropagation();
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

                            const updatedLead = { ...selectedLead, incluir_sitplan: true };
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
                        }}
                      >
                        ✅ Sim
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Histórico de Ligações */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Histórico de Ligações
                    </Label>
                    <Badge variant="outline">
                      {ligacoesHistorico.length} {ligacoesHistorico.length === 1 ? 'ligação' : 'ligações'}
                    </Badge>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {loadingHistorico ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
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
                               <span className="text-muted-foreground text-xs">
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
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nenhuma ligação registrada ainda
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <Label className="text-sm text-muted-foreground">Observações</Label>
                  <Textarea 
                    value={editingLead?.observacoes || selectedLead.observacoes || ""} 
                    onChange={(e) => {
                      const updatedLead = { ...selectedLead, observacoes: e.target.value };
                      setEditingLead(updatedLead);
                    }}
                    placeholder="Adicione observações sobre o lead..."
                    className="mt-1"
                  />
                </div>

                {/* PA Estimado */}
                <div>
                  <Label className="text-sm text-muted-foreground">PA Estimado</Label>
                  <Input 
                    value={editingLead?.pa_estimado || selectedLead.pa_estimado || ""} 
                    onChange={(e) => {
                      const updatedLead = { ...selectedLead, pa_estimado: e.target.value };
                      setEditingLead(updatedLead);
                    }}
                  />
                </div>

                {/* SitPlan */}
                <div>
                  <Label className="text-sm text-muted-foreground">SitPlan</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="date" 
                      value={editingLead?.data_sitplan || selectedLead.data_sitplan || ""} 
                      onChange={(e) => {
                        const updatedLead = { ...selectedLead, data_sitplan: e.target.value };
                        setEditingLead(updatedLead);
                      }}
                    />
                    <Button size="sm" variant="outline">+</Button>
                  </div>
                </div>

                {/* Agendamento de Ligação */}
                <div className="mt-6">
                  <AgendarLigacao 
                    leadId={selectedLead.id} 
                    leadNome={selectedLead.nome}
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
                    variant="outline" 
                    onClick={() => {
                      setSelectedLead(null);
                      setEditingLead(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveLead}
                    disabled={saving || !editingLead}
                    className="w-full sm:w-auto"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para agendar "Ligar Depois" */}
        <Dialog open={showLigarDepoisDialog} onOpenChange={setShowLigarDepoisDialog}>
          <DialogContent className="max-w-sm sm:max-w-md border-0 shadow-xl">
            <DialogHeader className="text-center pb-4">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">
                Agendar Ligação
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Selecione uma data para agendar a ligação com este lead
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              {leadParaLigarDepois && (
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Lead:</p>
                  <p className="font-medium text-base sm:text-lg truncate">{leadParaLigarDepois.nome}</p>
                </div>
              )}
              
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Data *
                </Label>
                
                <Input
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
                <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
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
                <Label htmlFor="observacoes-agendamento" className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Observações
                </Label>
                <Textarea
                  id="observacoes-agendamento"
                  placeholder="Adicione observações sobre o agendamento..."
                  value={observacoesAgendamento}
                  onChange={(e) => setObservacoesAgendamento(e.target.value)}
                  rows={3}
                  className="border-2 rounded-lg sm:rounded-xl resize-none focus:border-primary/50 transition-colors text-sm"
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
