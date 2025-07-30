import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/ui/shine-border";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Play, Save, ArrowLeft, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Lead = Tables<"leads">;

type PresentationStage = 'initial' | 'transition' | 'countdown' | 'presenting' | 'finished';

export default function TA() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<PresentationStage>('initial');
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [transitionStep, setTransitionStep] = useState(0);
  const [selectedEtapa, setSelectedEtapa] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [agendamentoDate, setAgendamentoDate] = useState<Date>();

  // Carregar leads selecionados para TA do banco de dados
  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["ta-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("incluir_ta", true)
        .order("ta_order", { ascending: true }); // Ordenar por ta_order
      
      if (error) throw error;
      console.log(`🎯 TA encontrou ${data?.length || 0} leads selecionados:`, 
        data?.map(lead => ({ id: lead.id, nome: lead.nome, ta_order: lead.ta_order }))
      );
      return data as Lead[];
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
    setStage('transition');
    setCurrentLeadIndex(0);
    setTransitionStep(0);
  };

  const saveAndNext = async () => {
    if (!selectedEtapa) return;
    
    const currentLead = leads[currentLeadIndex];
    
    try {
      // Atualizar etapa do lead
      await supabase
        .from("leads")
        .update({ 
          etapa: selectedEtapa as any,
          observacoes: observacoes || currentLead.observacoes
        })
        .eq("id", currentLead.id);

      // Se for "Ligar Depois" e tem data de agendamento, criar agendamento
      if (selectedEtapa === "Ligar Depois" && agendamentoDate) {
        await supabase
          .from("agendamentos_ligacoes")
          .insert({
            lead_id: currentLead.id,
            data_agendamento: agendamentoDate.toISOString(),
            observacoes: observacoes,
            user_id: currentLead.user_id
          });
      }

      // Resetar campos para o próximo lead
      setSelectedEtapa("");
      setObservacoes("");
      setAgendamentoDate(undefined);

      if (currentLeadIndex < leads.length - 1) {
        setCurrentLeadIndex(currentLeadIndex + 1);
      } else {
        setStage('finished');
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
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
  };

  
  const etapasOptions = [
    "Todos", "Novo", "TA", "Não atendido", "OI", "Delay OI", "PC", "Delay PC", 
    "N", "Apólice Emitida", "Apólice Entregue", "C2", "Delay C2", "Ligar Depois", 
    "Marcar", "Não", "Proposta Cancelada", "Apólice Cancelada"
  ];

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
            <Button
              onClick={startPresentation}
              className="px-12 py-6 text-xl font-bold bg-white/5 backdrop-blur-md border border-[#00FFF0] text-[#00FFF0] hover:bg-[#00FFF0]/20 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(0,255,240,0.3)]"
            >
              <Play className="mr-3 h-6 w-6" />
              INICIAR
            </Button>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-[#A9A9A9]">Nenhum lead foi enviado para TA ainda.</p>
              <p className="text-sm text-[#A9A9A9]">Use o botão "Editar" no SitPlan para selecionar leads.</p>
              <Button
                onClick={() => navigate('/dashboard/sitplan')}
                className="px-8 py-4 bg-white/5 backdrop-blur-md border border-[#FF00C8] text-[#FF00C8] hover:bg-[#FF00C8]/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
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
      <div className="fixed inset-0 bg-[#0D0D0D] z-50 overflow-auto">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img 
            src={getLeadImageUrl(currentLead.nome)}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/80 to-[#0D0D0D]/60" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1 - Informações do Lead */}
            <div className="bg-white/5 backdrop-blur-md border-2 border-[#00FFF0] rounded-2xl">
              <div className="p-6 h-full">
                <h2 className="text-4xl font-bold text-white mb-6">{currentLead.nome}</h2>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-lg">
                  <div>
                    <span className="text-[#00FFF0] font-semibold text-lg">Cidade:</span>
                    <p className="text-white/90 text-lg">{currentLead.cidade || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <span className="text-[#00FFF0] font-semibold text-lg">Etapa:</span>
                    <p className="text-white/90 text-lg">{currentLead.etapa}</p>
                  </div>

                  <div>
                    <span className="text-[#00FFF0] font-semibold text-lg">Profissão:</span>
                    <p className="text-white/90 text-lg">{currentLead.profissao || 'N/A'}</p>
                  </div>

                  <div>
                    <span className="text-[#00FFF0] font-semibold text-lg">Telefone:</span>
                    <p className="text-white/90 text-lg">{currentLead.telefone || 'N/A'}</p>
                  </div>

                  <div>
                    <span className="text-[#00FFF0] font-semibold text-lg">Casado:</span>
                    <p className="text-white/90 text-lg">{currentLead.casado ? 'Sim' : 'Não'}</p>
                  </div>

                  <div>
                    <span className="text-[#00FFF0] font-semibold text-lg">Filhos:</span>
                    <p className="text-white/90 text-lg">{currentLead.tem_filhos ? 'Sim' : 'Não'}</p>
                  </div>

                  <div>
                    <span className="text-[#00FFF0] font-semibold text-lg">Recomendante:</span>
                    <p className="text-white/90 text-lg">{currentLead.recomendante || 'N/A'}</p>
                  </div>

                  <div>
                    <span className="text-[#00FFF0] font-semibold text-lg">Email:</span>
                    <p className="text-white/90 text-lg truncate">{currentLead.email || 'N/A'}</p>
                  </div>
                </div>

                {currentLead.observacoes && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <span className="text-[#00FFF0] font-semibold text-lg">Observações:</span>
                    <p className="text-white/90 text-base mt-2">{currentLead.observacoes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2 - Ações */}
            <div className="bg-white/5 backdrop-blur-md border-2 border-[#FF00C8] rounded-2xl">
              <div className="p-6 h-full flex flex-col">
                <h3 className="text-xl font-bold text-white mb-4">Ações do TA</h3>
                
                <div className="space-y-4 flex-1">
                  {/* Seletor de Etapa */}
                  <div>
                    <Label className="text-[#00FFF0] font-medium text-sm">Nova Etapa</Label>
                    <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
                      <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white h-9">
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {etapasOptions.map((etapa) => (
                          <SelectItem key={etapa} value={etapa}>
                            {etapa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo de Observações */}
                  <div>
                    <Label className="text-[#00FFF0] font-medium text-sm">Observações</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Notas sobre este contato..."
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder-white/50 min-h-[80px] text-sm"
                    />
                  </div>

                  {/* Agendamento para Ligar Depois */}
                  {selectedEtapa === "Ligar Depois" && (
                    <div>
                      <Label className="text-[#00FFF0] font-medium text-sm">Data para Ligar</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full mt-1 justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 text-sm",
                              !agendamentoDate && "text-white/50"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {agendamentoDate ? format(agendamentoDate, "dd/MM/yyyy") : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={agendamentoDate}
                            onSelect={setAgendamentoDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Botão de Salvar */}
                <Button
                  onClick={saveAndNext}
                  disabled={!selectedEtapa || (selectedEtapa === "Ligar Depois" && !agendamentoDate)}
                  className="w-full py-3 text-lg font-bold bg-[#FF00C8]/20 backdrop-blur-md border border-[#FF00C8] text-[#FF00C8] hover:bg-[#FF00C8]/40 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,0,200,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  <Save className="mr-2 h-5 w-5" />
                  SALVAR E PRÓXIMO
                </Button>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="text-[#A9A9A9] text-sm">
              Lead {currentLeadIndex + 1} de {leads.length}
            </div>
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
          <Button
            onClick={resetPresentation}
            className="px-12 py-6 text-xl font-bold bg-white/5 backdrop-blur-md border border-[#FF00C8] text-[#FF00C8] hover:bg-[#FF00C8]/20 hover:scale-105 transition-all duration-300"
          >
            REINICIAR
          </Button>
        </div>
      </div>
    );
  }

  return null;
}