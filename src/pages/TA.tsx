import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Play, Save, ArrowLeft } from "lucide-react";

type Lead = Tables<"leads">;

type PresentationStage = 'initial' | 'transition' | 'countdown' | 'presenting' | 'finished';

export default function TA() {
  const navigate = useNavigate();
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [stage, setStage] = useState<PresentationStage>('initial');
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [transitionStep, setTransitionStep] = useState(0);

  useEffect(() => {
    // Get selected leads from localStorage
    const stored = localStorage.getItem('selectedLeadsForTA');
    if (stored) {
      setSelectedLeadIds(JSON.parse(stored));
    }
  }, []);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["ta-leads", selectedLeadIds],
    queryFn: async () => {
      if (selectedLeadIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("id", selectedLeadIds)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: selectedLeadIds.length > 0,
  });

  // Transition effect
  useEffect(() => {
    if (stage === 'transition') {
      const timer = setTimeout(() => {
        setStage('presenting');
      }, 12000); // Aumentado para 12 segundos para dar tempo completo da apresentação
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

  const saveAndNext = () => {
    if (currentLeadIndex < leads.length - 1) {
      setCurrentLeadIndex(currentLeadIndex + 1);
    } else {
      setStage('finished');
    }
  };

  const resetPresentation = () => {
    setStage('initial');
    setCurrentLeadIndex(0);
    setCountdown(5);
    setTransitionStep(0);
  };

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
        <ParticleTextEffect words={['SEJA BEM-VINDO', 'AGILIDADE NA ROTINA', 'RESULTADO NA PONTA', 'O SEU TA', 'COMEÇA AGORA']} />
        
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
                onClick={() => navigate('/sitplan')}
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
        <ParticleTextEffect words={['SEJA BEM-VINDO', 'AGILIDADE NA ROTINA', 'RESULTADO NA PONTA', 'O SEU TA', 'COMEÇA AGORA']} />
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

        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            {/* Lead Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 shadow-[0_0_50px_rgba(0,255,240,0.2)] animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Lead Image */}
                <div className="md:col-span-1">
                  <img
                    src={getLeadImageUrl(currentLead.nome)}
                    alt={currentLead.nome}
                    className="w-full h-80 object-cover rounded-2xl border border-[#00FFF0]/30"
                  />
                </div>

                {/* Lead Information */}
                <div className="md:col-span-2 space-y-6">
                  <h2 className="text-5xl font-bold text-white mb-6">{currentLead.nome}</h2>
                  
                  <div className="grid grid-cols-2 gap-6 text-lg">
                    <div>
                      <span className="text-[#00FFF0] font-semibold">Cidade:</span>
                      <p className="text-white">{currentLead.cidade || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <span className="text-[#00FFF0] font-semibold">Etapa:</span>
                      <p className="text-white">{currentLead.etapa}</p>
                    </div>

                    <div>
                      <span className="text-[#00FFF0] font-semibold">Profissão:</span>
                      <p className="text-white">{currentLead.profissao || 'Não informado'}</p>
                    </div>

                    <div>
                      <span className="text-[#00FFF0] font-semibold">Telefone:</span>
                      <p className="text-white">{currentLead.telefone || 'Não informado'}</p>
                    </div>

                    <div>
                      <span className="text-[#00FFF0] font-semibold">Casado:</span>
                      <p className="text-white">{currentLead.casado ? 'Sim' : 'Não'}</p>
                    </div>

                    <div>
                      <span className="text-[#00FFF0] font-semibold">Tem Filhos:</span>
                      <p className="text-white">{currentLead.tem_filhos ? 'Sim' : 'Não'}</p>
                    </div>

                    <div>
                      <span className="text-[#00FFF0] font-semibold">Recomendante:</span>
                      <p className="text-white">{currentLead.recomendante || 'Não informado'}</p>
                    </div>

                    <div>
                      <span className="text-[#00FFF0] font-semibold">Email:</span>
                      <p className="text-white">{currentLead.email || 'Não informado'}</p>
                    </div>

                    {currentLead.observacoes && (
                      <div className="col-span-2">
                        <span className="text-[#00FFF0] font-semibold">Observações:</span>
                        <p className="text-white mt-2">{currentLead.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center mt-12">
                <Button
                  onClick={saveAndNext}
                  className="px-16 py-6 text-2xl font-bold bg-[#FF00C8]/20 backdrop-blur-md border border-[#FF00C8] text-[#FF00C8] hover:bg-[#FF00C8]/40 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,0,200,0.3)]"
                >
                  <Save className="mr-3 h-6 w-6" />
                  SALVAR
                </Button>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center mt-8">
              <div className="text-[#A9A9A9] text-lg">
                Lead {currentLeadIndex + 1} de {leads.length}
              </div>
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