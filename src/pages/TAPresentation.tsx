import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShineBorder } from "@/components/ui/shine-border";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LiquidGlassTextarea from "@/components/ui/liquid-textarea";
import LiquidGlassInput from "@/components/ui/liquid-input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useTAActions, TAActionType } from "@/hooks/useTAActions";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Play, Save, ArrowLeft, CalendarIcon, Pause, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

type Lead = Tables<"leads">;

type PresentationStage = 'initial' | 'transition' | 'countdown' | 'presenting' | 'finished';

export default function TAPresentation() {
  const navigate = useNavigate();
  const googleCalendar = useGoogleCalendar();
  const [searchParams] = useSearchParams();
  const filterEtapa = searchParams.get('etapa');
  const filterProfissao = searchParams.get('profissao');
  const isExclusivo = searchParams.get('exclusivo') === 'true';
  const isPreviewMode = searchParams.get('preview') === 'true';
  const shouldStartImmediately = searchParams.get('start') === 'true';
  const [stage, setStage] = useState<PresentationStage>('initial');
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [transitionStep, setTransitionStep] = useState(0);
  const [selectedEtapa, setSelectedEtapa] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [agendamentoDate, setAgendamentoDate] = useState<Date>();
  const [agendamentoTime, setAgendamentoTime] = useState<string>("");

  const { recordTAAction } = useTAActions();

  // Buscar agendamentos existentes para a data selecionada
  const { data: agendamentosExistentes = [] } = useQuery({
    queryKey: ['agendamentos-data', agendamentoDate?.toISOString()],
    queryFn: async () => {
      if (!agendamentoDate) return [];
      
      const startOfDay = new Date(agendamentoDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(agendamentoDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data } = await supabase
        .from('agendamentos_ligacoes')
        .select('data_agendamento')
        .gte('data_agendamento', startOfDay.toISOString())
        .lte('data_agendamento', endOfDay.toISOString())
        .eq('status', 'pendente');
      
      return data || [];
    },
    enabled: !!agendamentoDate
  });

  // Extrair horários ocupados
  const horariosOcupados = agendamentosExistentes.map(ag => {
    const date = new Date(ag.data_agendamento);
    return format(date, 'HH:mm');
  });

  // Carregar leads selecionados para TA do banco de dados
  const { data: allLeads = [], isLoading, refetch } = useQuery({
    queryKey: ["ta-leads", filterEtapa, filterProfissao, isExclusivo],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .eq("incluir_ta", true);

      // Se for acesso exclusivo, filtra apenas leads exclusivos para esta categoria
      if (isExclusivo && (filterEtapa || filterProfissao)) {
        if (filterEtapa) {
          query = query
            .eq("ta_categoria_ativa", "etapa")
            .eq("ta_categoria_valor", filterEtapa)
            .eq("ta_exclusividade", true);
        }
        if (filterProfissao) {
          query = query
            .eq("ta_categoria_ativa", "profissao")
            .eq("ta_categoria_valor", filterProfissao)
            .eq("ta_exclusividade", true);
        }
      } else {
        // Filtros normais (não exclusivos)
        if (filterEtapa) {
          // Buscar leads pela etapa original (etapa_antes_ta) quando estão em TA
          query = query.or(`etapa.eq.${filterEtapa},and(etapa.eq.TA,etapa_antes_ta.eq.${filterEtapa})`);
        }
        if (filterProfissao) {
          query = query.eq("profissao", filterProfissao);
        }
      }

      const { data, error } = await query.order("ta_order", { ascending: true });
      
      if (error) throw error;
      console.log(`🎯 TA encontrou ${data?.length || 0} leads selecionados:`, 
        data?.map(lead => ({ id: lead.id, nome: lead.nome, ta_order: lead.ta_order, exclusivo: lead.ta_exclusividade }))
      );
      return data as Lead[];
    },
  });

  // Filtrar leads localmente se não há filtros de URL
  const leads = allLeads;

  // Configurar realtime para sincronização automática
  useEffect(() => {
    const channel = supabase
      .channel('ta-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: 'incluir_ta=eq.true'
        },
        (payload) => {
          console.log('🎯 TA detectou mudança nos leads:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Auto-start presentation if ?start=true
  useEffect(() => {
    if (shouldStartImmediately && leads.length > 0 && stage === 'initial' && !hasAutoStarted) {
      setHasAutoStarted(true);
      setStage('presenting');
      setCurrentLeadIndex(0);
      console.log('🎯 TA: auto-start ativado, iniciando apresentação');
    }
  }, [shouldStartImmediately, leads.length, stage, hasAutoStarted]);

  // Transition effect
  useEffect(() => {
    if (stage === 'transition') {
      const timer = setTimeout(() => {
        setStage('presenting');
      }, 7000); // 6 segundos para as 3 palavras + 1 segundo extra após "COMEÇA AGORA"
      return () => {
        clearTimeout(timer);
      };
    }
  }, [stage]);

  // Countdown effect
  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (stage === 'countdown' && countdown === 0) {
      setStage('presenting');
    }
  }, [stage, countdown]);

  const startPresentation = () => {
    if (leads.length === 0) return;
    setStage('presenting');
    setCurrentLeadIndex(0);
    setTransitionStep(0);
    console.log('🎯 TA: apresentação iniciada, indo direto para presenting');
  };

  const saveAndNext = async () => {
    if (!selectedEtapa) return;
    
    const currentLead = leads[currentLeadIndex];
    
    try {
      // Mapear etapa para TAActionType
      const etapaMapping: { [key: string]: TAActionType } = {
        "Não atendido": "NAO_ATENDIDO",
        "Ligar Depois": "LIGAR_DEPOIS",
        "Marcar no Whatsapp": "MARCAR",
        "OI": "OI",
        "Não Tem Interesse": "NAO_TEM_INTERESSE"
      };
      
      const taAction = etapaMapping[selectedEtapa];
      
      // Gravar ação individual na tabela ta_actions
      if (taAction) {
        await recordTAAction(currentLead.id, taAction);
      }

      // Mapear labels de exibição para valores do banco de dados
      const etapaDatabaseMapping: { [key: string]: string } = {
        "Não Tem Interesse": "Não",
        "Marcar no Whatsapp": "Marcar"
      };
      const etapaPipeline = etapaDatabaseMapping[selectedEtapa] || selectedEtapa;

      // Atualizar etapa do lead
      await supabase
        .from("leads")
        .update({ 
          etapa: etapaPipeline as any,
          observacoes: observacoes || currentLead.observacoes
        })
        .eq("id", currentLead.id);

      // Registrar no histórico do TA
      await supabase
        .from("ta_historico")
        .insert({
          lead_id: currentLead.id,
          user_id: currentLead.user_id,
          etapa_anterior: currentLead.etapa,
          etapa_nova: etapaPipeline as any,
          observacoes: observacoes,
          origem: 'ta'
        });

      // Se for "Ligar Depois" e tem data de agendamento, criar TASK no Google Tasks
      if (selectedEtapa === "Ligar Depois" && agendamentoDate && agendamentoTime) {
        // Combinar data e horário para a task
        const [hours, minutes] = agendamentoTime.split(':');
        const dataCompleta = new Date(agendamentoDate);
        dataCompleta.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Atualizar o lead com data_callback
        await supabase
          .from("leads")
          .update({
            data_callback: dataCompleta.toISOString()
          })
          .eq("id", currentLead.id);

        // Criar Google Task diretamente (sem criar agendamento)
        if (googleCalendar.isConnected) {
          try {
            await googleCalendar.createTaskAsync({
              title: `Ligar para ${currentLead.nome}`,
              notes: observacoes ? `${observacoes}\n\nHorário: ${agendamentoTime}` : `Horário: ${agendamentoTime}`,
              dueDate: format(dataCompleta, 'yyyy-MM-dd')
            });
          } catch (error) {
            console.error('Erro ao criar task no Google:', error);
          }
        }
      }

      // Se for "OI" e tem data de agendamento, criar TASK no Google Tasks (não evento de calendário)
      if (selectedEtapa === "OI" && agendamentoDate && agendamentoTime) {
        // Combinar data e horário
        const [hours, minutes] = agendamentoTime.split(':');
        const dataCompleta = new Date(agendamentoDate);
        dataCompleta.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Atualizar o lead com data_callback
        await supabase
          .from("leads")
          .update({
            data_callback: dataCompleta.toISOString()
          })
          .eq("id", currentLead.id);

        // Criar Google Task (não calendário) no TA
        if (googleCalendar.isConnected) {
          try {
            await googleCalendar.createTaskAsync({
              title: `OI - ${currentLead.nome}`,
              notes: observacoes ? `${observacoes}\n\nHorário: ${agendamentoTime}` : `Horário: ${agendamentoTime}`,
              dueDate: format(dataCompleta, 'yyyy-MM-dd')
            });
          } catch (error) {
            console.error('Erro ao criar task no Google:', error);
          }
        }
      }

      // Resetar campos para o próximo lead
      setSelectedEtapa("");
      setObservacoes("");
      setAgendamentoDate(undefined);
      setAgendamentoTime("");

      if (currentLeadIndex < leads.length - 1) {
        setCurrentLeadIndex(currentLeadIndex + 1);
      } else {
        setStage('finished');
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const finalizarTA = async () => {
    try {
      // Buscar registros de ta_actions para calcular as métricas
      const { data: taActions, error: actionsError } = await supabase
        .from("ta_actions")
        .select("*")
        .in("lead_id", leads.map(lead => lead.id))
        .gte("created_at", new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()); // últimas 4 horas

      if (actionsError) throw actionsError;

      // Calcular métricas do relatório
      const totalLeads = leads.length;
      const totalLigacoes = taActions?.length || 0;
      const ligacoesAtendidas = taActions?.filter(a => a.etapa === "OI").length || 0;
      const ligacoesNaoAtendidas = taActions?.filter(a => a.etapa === "NAO_ATENDIDO").length || 0;
      const ligacoesLigarDepois = taActions?.filter(a => a.etapa === "LIGAR_DEPOIS").length || 0;
      const ligacoesAgendadas = taActions?.filter(a => a.etapa === "OI").length || 0;
      const ligacoesMarcadas = taActions?.filter(a => a.etapa === "MARCAR").length || 0;
      const ligacoesNaoTemInteresse = taActions?.filter(a => a.etapa === "NAO_TEM_INTERESSE").length || 0;

      // Salvar relatório
      const { error: reportError } = await supabase
        .from("ta_relatorios")
        .insert({
          user_id: leads[0]?.user_id,
          data_relatorio: new Date().toISOString().split('T')[0],
          periodo_inicio: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          periodo_fim: new Date().toISOString(),
          total_leads: totalLeads,
          total_ligacoes: totalLigacoes,
          ligacoes_atendidas: ligacoesAtendidas,
          ligacoes_nao_atendidas: ligacoesNaoAtendidas,
          ligacoes_ligar_depois: ligacoesLigarDepois,
          ligacoes_agendadas: ligacoesAgendadas,
          ligacoes_marcadas: ligacoesMarcadas,
          ligacoes_nao_tem_interesse: ligacoesNaoTemInteresse
        });

      if (reportError) throw reportError;

      // Remover todos os leads do TA (incluir_ta = false)
      const leadIds = leads.map(lead => lead.id);
      
      const { error } = await supabase
        .from("leads")
        .update({ incluir_ta: false })
        .in("id", leadIds);

      if (error) throw error;

      // Limpar o estado do TA
      setStage('initial');
      setCurrentLeadIndex(0);
      setCountdown(5);
      setTransitionStep(0);
      setSelectedEtapa("");
      setObservacoes("");
      setAgendamentoDate(undefined);
      
      // Navegar para o relatório do TA
      navigate('/dashboard/reports');
    } catch (error) {
      console.error("Erro ao finalizar TA:", error);
    }
  };

  const resetPresentation = () => {
    setStage('initial');
    setCurrentLeadIndex(0);
    setCountdown(5);
      setTransitionStep(0);
      setSelectedEtapa("");
      setObservacoes("");
      setAgendamentoDate(undefined);
      setAgendamentoTime("");
  };

  const handleWhatsApp = (telefone: string | null) => {
    if (!telefone) return;
    const cleanPhone = telefone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  
  const etapasOptions = ["Não atendido", "Ligar Depois", "Marcar no Whatsapp", "OI", "Não Tem Interesse"];

  const getLeadImageUrl = (leadName: string) => {
    // Generate different Unsplash images based on lead name
    const imageIds = [
      'photo-1507003211169-0a1dd7228f2d', // professional person
      'photo-1494790108755-2616b612b786', // woman professional
      'photo-1472099645785-5658abf4ff4e', // man professional
      'photo-1517841905240-472988babdf9', // business woman
      'photo-1519085360753-af0119f7cbe7', // business man
    ];
    const index = leadName.length % imageIds.length;
    return `https://images.unsplash.com/${imageIds[index]}?w=400&h=600&fit=crop&crop=face`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // Initial stage
  if (stage === 'initial') {
    return (
      <div className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
        {/* Particle background */}
        <ParticleTextEffect words={['SEJA BEM-VINDO', 'O SEU TA', 'COMEÇA AGORA']} />
        
        <div className="min-h-screen flex flex-col items-center justify-center relative z-10">
          {leads.length > 0 ? (
            <div className="flex items-center gap-3">
              <button
                onClick={isPreviewMode ? undefined : () => navigate('/dashboard/ta')}
                className="h-10 px-4 rounded-full border border-white/40 text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                onClick={isPreviewMode ? undefined : startPresentation}
                className="bg-[#d4ff4a] text-black rounded-full p-3 hover:bg-[#c9f035] transition-colors shadow-2xl"
                title="Iniciar Apresentação"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-[#A9A9A9]">Nenhum lead foi enviado para TA ainda.</p>
              <p className="text-sm text-[#A9A9A9]">Use o botão "Editar" no SitPlan para selecionar leads.</p>
              <button
                onClick={() => navigate('/dashboard/ta')}
                className="h-10 px-4 rounded-full border border-white/40 text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Transition stage
  if (stage === 'transition') {
    return (
      <div className="fixed inset-0 bg-[#0D0D0D] z-50 flex items-center justify-center">
        <ParticleTextEffect words={['SEJA BEM-VINDO', 'O SEU TA', 'COMEÇA AGORA']} />
      </div>
    );
  }

  // Countdown stage
  if (stage === 'countdown') {
    return (
      <div className="fixed inset-0 bg-[#0D0D0D] z-50 flex items-center justify-center">
        <ParticleTextEffect words={[countdown.toString(), 'CONTAGEM', 'REGRESSIVA']} />
        <div className="text-center relative z-10">
          <div className="text-9xl font-bold text-[#00FFF0] animate-pulse">
            {countdown}
          </div>
          <div className="text-xl text-[#A9A9A9] mt-4">
            segundos para começar...
          </div>
        </div>
      </div>
    );
  }

  // Presentation stage
  if (stage === 'presenting') {
    const currentLead = leads[currentLeadIndex];
    
    return (
      <div className="fixed inset-0 bg-[#0D0D0D] z-50 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at center, #6EC8FF 0%, transparent 70%)",
            opacity: 0.6,
            mixBlendMode: "screen",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-700/40 via-gray-600/30 to-gray-500/20" />

        <div className="relative z-10 h-screen flex items-center justify-center p-3 pb-20">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1 - Informações do Lead */}
            <div className="rounded-2xl border border-border/30 bg-border/10 backdrop-blur-md shadow-xl">
              <div className="p-4 h-full">
                {/* Header com nome e botão WhatsApp */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold text-white">{currentLead.nome}</h2>
                  
                  {/* Botão WhatsApp */}
                  <button
                    onClick={() => handleWhatsApp(currentLead.telefone)}
                    disabled={!currentLead.telefone}
                    className="bg-[#d4ff4a] text-black rounded-full p-2.5 hover:bg-[#c9f035] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <span className="text-white/70 font-medium text-xs">Cidade</span>
                    <p className="text-white/90">{currentLead.cidade || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <span className="text-white/70 font-medium text-xs">Etapa Anterior</span>
                    <Badge className={`text-white text-xs ${getEtapaColor(currentLead.etapa_antes_ta || currentLead.etapa)}`}>
                      {currentLead.etapa_antes_ta || currentLead.etapa}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-white/70 font-medium text-xs">Telefone</span>
                    <p className="text-white/90">{currentLead.telefone || 'N/A'}</p>
                  </div>

                  <div>
                    <span className="text-white/70 font-medium text-xs">Profissão</span>
                    <p className="text-white/90">{currentLead.profissao || 'N/A'}</p>
                  </div>

                  <div>
                    <span className="text-white/70 font-medium text-xs">Casado</span>
                    <p className="text-white/90">{currentLead.casado ? 'Sim' : 'Não'}</p>
                  </div>

                  <div>
                    <span className="text-white/70 font-medium text-xs">Filhos</span>
                    <p className="text-white/90">{currentLead.tem_filhos ? 'Sim' : 'Não'}</p>
                  </div>

                  <div className="col-span-2">
                    <span className="text-white/70 font-medium text-xs">Recomendante</span>
                    <p className="text-white/90 truncate">{currentLead.recomendante || 'N/A'}</p>
                  </div>

                  <div>
                    <span className="text-white/70 font-medium text-xs">Email</span>
                    <p className="text-white/90 truncate">{currentLead.email || 'N/A'}</p>
                  </div>
                </div>

                {currentLead.observacoes && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <span className="text-white/70 font-medium text-xs">Observações</span>
                    <p className="text-white/90 text-xs mt-1 line-clamp-2">{currentLead.observacoes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2 - Ações */}
            <div className="rounded-2xl border border-border/30 bg-border/10 backdrop-blur-md shadow-xl">
              <div className="p-4 h-full flex flex-col">
                <h3 className="text-lg font-bold text-white mb-3">Ações do TA</h3>
                
                <div className="space-y-3 flex-1">
                  {/* Seletor de Etapa */}
                  <div>
                    <Label className="text-white/70 font-medium text-xs">Nova Etapa</Label>
                    <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
                      <SelectTrigger className="mt-1 rounded-2xl border border-border/40 bg-border/10 backdrop-blur-md text-white h-9">
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-white/20 bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl">
                        {etapasOptions.map((etapa) => (
                          <SelectItem 
                            key={etapa} 
                            value={etapa}
                            className="text-white/90 focus:bg-white/10 focus:text-white"
                          >
                            {etapa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo de Observações */}
                  <div>
                    <Label className="text-white/70 font-medium text-xs">Observações</Label>
                    <LiquidGlassTextarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Notas sobre este contato..."
                      className="mt-1 text-white placeholder-white/50 min-h-[60px] text-sm"
                    />
                  </div>

                  {/* Agendamento para Ligar Depois e OI */}
                  {(selectedEtapa === "Ligar Depois" || selectedEtapa === "OI") && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-white/70 font-medium text-xs">
                          {selectedEtapa === "OI" ? "Data *" : "Data *"}
                        </Label>
                        <LiquidGlassInput
                          type="date"
                          value={agendamentoDate ? format(agendamentoDate, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              const [year, month, day] = e.target.value.split('-').map(Number);
                              setAgendamentoDate(new Date(year, month - 1, day));
                            } else {
                              setAgendamentoDate(undefined);
                            }
                          }}
                          min={format(new Date(), "yyyy-MM-dd")}
                          className="w-full mt-1 h-9 text-white placeholder:text-white/70"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-white/70 font-medium text-xs">Horário *</Label>
                        <Select value={agendamentoTime} onValueChange={setAgendamentoTime}>
                          <SelectTrigger className="mt-1 rounded-2xl border border-border/40 bg-border/10 backdrop-blur-md text-white h-9 text-xs">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border border-white/20 bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl max-h-[200px]">
                            {[
                              "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
                              "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
                              "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
                              "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                              "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
                              "20:00", "20:30", "21:00", "21:30", "22:00", "22:30",
                              "23:00", "23:30", "00:00"
                            ].map((time) => {
                              const isOcupado = horariosOcupados.includes(time);
                              return (
                                <SelectItem 
                                  key={time} 
                                  value={time}
                                  disabled={isOcupado}
                                  className={cn(
                                    "text-white/90 focus:bg-white/10 focus:text-white",
                                    isOcupado && "text-white/40 cursor-not-allowed"
                                  )}
                                >
                                  {time} {isOcupado ? "(Ocupado)" : ""}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão de Salvar */}
                <button
                  onClick={saveAndNext}
                  disabled={
                    !selectedEtapa || 
                    ((selectedEtapa === "Ligar Depois" || selectedEtapa === "OI") && (!agendamentoDate || !agendamentoTime))
                  }
                  aria-label="Salvar e próximo"
                  className="h-10 w-10 mt-4 rounded-full bg-[#d4ff4a] text-black hover:bg-[#c9f035] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl mx-auto flex items-center justify-center"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Botão Pausar - fixo no canto inferior esquerdo */}
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => navigate('/dashboard/ta')}
            className="h-10 px-4 rounded-full border border-white/40 text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            Pausar
          </button>
        </div>

        {/* Progress indicator - fixo no centro inferior */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="text-[#A9A9A9] text-sm">
            Lead {currentLeadIndex + 1} de {leads.length}
          </div>
        </div>
      </div>
    );
  }

  // Finished stage
  if (stage === 'finished') {
    return (
      <div className="fixed inset-0 bg-[#0D0D0D] z-50 flex items-center justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold text-[#00FFF0] tracking-wider">
            APRESENTAÇÃO FINALIZADA
          </h1>
          <p className="text-xl text-[#A9A9A9]">
            Todos os {leads.length} leads foram apresentados
          </p>
          <div className="flex gap-6 justify-center">
            <Button
              onClick={finalizarTA}
              className="px-12 py-6 text-xl font-bold bg-white/5 backdrop-blur-md border border-[#00FFF0] text-[#00FFF0] hover:bg-[#00FFF0]/20 hover:scale-105 transition-all duration-300"
            >
              FINALIZAR
            </Button>
            <Button
              onClick={resetPresentation}
              className="px-12 py-6 text-xl font-bold bg-white/5 backdrop-blur-md border border-[#FF00C8] text-[#FF00C8] hover:bg-[#FF00C8]/20 hover:scale-105 transition-all duration-300"
            >
              REINICIAR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}