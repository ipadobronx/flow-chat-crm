import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { ArrowLeft, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

type Lead = Tables<"leads">;

export default function TACategories() {
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    categoria: string;
    tipo: 'etapa' | 'profissao';
    conflitos: any[];
  }>({ open: false, categoria: '', tipo: 'etapa', conflitos: [] });

  // Carregar leads selecionados para TA
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["ta-categories-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("incluir_ta", true)
        .order("ta_order", { ascending: true });
      
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Detectar conflitos entre categorias
  const detectarConflitos = (categoria: string, tipo: 'etapa' | 'profissao') => {
    const leadsNaCategoria = leads.filter(lead => {
      if (tipo === 'etapa') {
        return lead.etapa === categoria;
      } else {
        return lead.profissao === categoria;
      }
    });

    const conflitos = leadsNaCategoria.filter(lead => {
      if (tipo === 'etapa') {
        // Verifica se o lead também aparece em alguma profissão
        return lead.profissao && lead.profissao.trim() !== "";
      } else {
        // Verifica se o lead também aparece em alguma etapa válida
        return lead.etapa && lead.etapa !== "Todos";
      }
    });

    return { leadsNaCategoria, conflitos };
  };

  // Função para acessar categoria
  const acessarCategoria = (categoria: string, tipo: 'etapa' | 'profissao') => {
    const { leadsNaCategoria, conflitos } = detectarConflitos(categoria, tipo);
    
    // Se não há conflitos, navegar diretamente
    if (conflitos.length === 0) {
      const param = tipo === 'etapa' ? 'etapa' : 'profissao';
      navigate(`/dashboard/ta-presentation?${param}=${encodeURIComponent(categoria)}`);
      return;
    }

    // Com conflitos: mostrar confirmação
    setConfirmDialog({
      open: true,
      categoria,
      tipo,
      conflitos
    });
  };

  // Função para confirmar e processar remoção automática
  const confirmarRemocao = async () => {
    const { categoria, tipo, conflitos } = confirmDialog;
    const { leadsNaCategoria } = detectarConflitos(categoria, tipo);

    try {
      if (tipo === 'profissao') {
        // Profissão: remover da etapa automaticamente
        const { error } = await supabase
          .from('leads')
          .update({
            ta_categoria_ativa: 'profissao',
            ta_categoria_valor: categoria,
            ta_exclusividade: true
          })
          .in('id', leadsNaCategoria.map(lead => lead.id));

        if (error) throw error;

        toast({
          title: "Leads movidos com sucesso",
          description: `${conflitos.length} lead(s) removido(s) das etapas automaticamente`,
        });
      } else {
        // Etapa: remover da profissão automaticamente  
        const { error } = await supabase
          .from('leads')
          .update({
            ta_categoria_ativa: 'etapa',
            ta_categoria_valor: categoria,
            ta_exclusividade: true
          })
          .in('id', leadsNaCategoria.map(lead => lead.id));

        if (error) throw error;

        toast({
          title: "Leads movidos com sucesso", 
          description: `${conflitos.length} lead(s) removido(s) das profissões automaticamente`,
        });
      }
      
      const param = tipo === 'etapa' ? 'etapa' : 'profissao';
      navigate(`/dashboard/ta-presentation?${param}=${encodeURIComponent(categoria)}&exclusivo=true`);
    } catch (error) {
      console.error('Erro ao processar categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao acessar categoria. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setConfirmDialog({ open: false, categoria: '', tipo: 'etapa', conflitos: [] });
    }
  };

  // Agrupar leads por etapa (inclui leads sem exclusividade e exclusivos de etapa)
  const leadsByEtapa = leads
    .filter(lead => !lead.ta_exclusividade || lead.ta_categoria_ativa === 'etapa')
    .reduce((acc, lead) => {
      const etapa = lead.etapa || "Sem Etapa";
      if (!acc[etapa]) {
        acc[etapa] = [];
      }
      // Evitar duplicatas
      if (!acc[etapa].find(existingLead => existingLead.id === lead.id)) {
        acc[etapa].push(lead);
      }
      return acc;
    }, {} as Record<string, Lead[]>);

  // Agrupar leads por profissão (inclui leads sem exclusividade e exclusivos de profissão)
  const leadsByProfissao = leads
    .filter(lead => !lead.ta_exclusividade || lead.ta_categoria_ativa === 'profissao')
    .reduce((acc, lead) => {
      const profissao = lead.profissao || "Sem Profissão";
      if (!acc[profissao]) {
        acc[profissao] = [];
      }
      // Evitar duplicatas
      if (!acc[profissao].find(existingLead => existingLead.id === lead.id)) {
        acc[profissao].push(lead);
      }
      return acc;
    }, {} as Record<string, Lead[]>);


  // Função para obter cor da etapa
  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case "Todos": return "from-blue-400 via-blue-500 to-blue-600";
      case "Novo": return "from-sky-400 via-sky-500 to-sky-600";
      case "TA": return "from-purple-500 via-purple-600 to-purple-700";
      case "Não atendido": return "from-red-500 via-red-600 to-red-700";
      case "Ligar Depois": return "from-yellow-500 via-yellow-600 to-yellow-700";
      case "Marcar": return "from-green-500 via-green-600 to-green-700";
      case "OI": return "from-indigo-400 via-indigo-500 to-indigo-600";
      case "Delay OI": return "from-yellow-400 via-yellow-500 to-yellow-600";
      case "PC": return "from-orange-400 via-orange-500 to-orange-600";
      case "Delay PC": return "from-red-400 via-red-500 to-red-600";
      case "N": return "from-purple-400 via-purple-500 to-purple-600";
      case "Apólice Emitida": return "from-green-400 via-green-500 to-green-600";
      case "Apólice Entregue": return "from-emerald-400 via-emerald-500 to-emerald-600";
      default: return "from-gray-400 via-gray-500 to-gray-600";
    }
  };

  // Função para obter cor aleatória para profissões
  const getProfissaoColor = (profissao: string) => {
    const colors = [
      "from-pink-400 via-pink-500 to-pink-600",
      "from-cyan-400 via-cyan-500 to-cyan-600",
      "from-amber-400 via-amber-500 to-amber-600",
      "from-lime-400 via-lime-500 to-lime-600",
      "from-rose-400 via-rose-500 to-rose-600",
      "from-teal-400 via-teal-500 to-teal-600",
      "from-violet-400 via-violet-500 to-violet-600",
      "from-fuchsia-400 via-fuchsia-500 to-fuchsia-600"
    ];
    const index = profissao.length % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-inter tracking-tight">Apresentação TA</h1>
            <p className="text-[#A9A9A9] font-inter">Selecione uma categoria para visualizar ou inicie a apresentação completa</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/dashboard/sitplan')}
              className="px-6 py-3 bg-white/5 backdrop-blur-md border border-[#A9A9A9] text-[#A9A9A9] hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              onClick={() => navigate('/dashboard/ta-presentation')}
              className="px-8 py-3 bg-white/5 backdrop-blur-md border border-[#00FFF0] text-[#00FFF0] hover:bg-[#00FFF0]/20 hover:scale-105 transition-all duration-300"
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar Apresentação
            </Button>
          </div>
        </div>

        {/* Seção por Etapa */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 font-inter tracking-tight">Por Etapa do Funil</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(leadsByEtapa).map(([etapa, leadsInEtapa]) => {
              const { conflitos } = detectarConflitos(etapa, 'etapa');
              
              const CardComponent = () => (
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#00FFF0]/10 overflow-hidden cursor-pointer">
                  <div className={`h-32 bg-gradient-to-r ${getEtapaColor(etapa)} animate-gradient-shift bg-[length:400%_400%] relative overflow-hidden`}>
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                        ETAPA
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-inter font-semibold text-xl mb-2 text-white tracking-tight">{etapa}</h3>
                    <p className="text-sm text-muted-foreground mb-4 font-inter">
                      Categoria com {leadsInEtapa.length} lead{leadsInEtapa.length !== 1 ? 's' : ''} selecionado{leadsInEtapa.length !== 1 ? 's' : ''}
                    </p>
                    
                    {/* Barra de Progresso */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white/70 font-inter">0% Concluído</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-white/30 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-inter font-semibold tracking-tight text-white">
                        {leadsInEtapa.length}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          acessarCategoria(etapa, 'etapa');
                        }}
                        className="inline-flex items-center justify-center rounded-xl text-sm font-inter font-medium h-9 px-4 bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 hover:scale-105 hover:bg-white/20 active:scale-95"
                      >
                        Acessar
                      </button>
                    </div>
                    
                    <div className="mt-3 flex items-center text-xs text-white/50 font-inter">
                      <div className="w-2 h-2 rounded-full bg-white/30 mr-2"></div>
                      Espaço privado
                    </div>
                  </div>
                </div>
              );

              return (
                <div 
                  key={etapa}
                  onClick={() => acessarCategoria(etapa, 'etapa')}
                >
                  <CardComponent />
                </div>
              );
            })}
          </div>
        </div>

        {/* Seção por Profissão */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 font-inter tracking-tight">Por Profissão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(leadsByProfissao).map(([profissao, leadsInProfissao]) => {
              const { conflitos } = detectarConflitos(profissao, 'profissao');
              
              const CardComponent = () => (
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#FF00C8]/10 overflow-hidden cursor-pointer">
                  <div className={`h-32 bg-gradient-to-r ${getProfissaoColor(profissao)} animate-gradient-shift bg-[length:400%_400%] relative overflow-hidden`}>
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                        PROFISSÃO
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-inter font-semibold text-xl mb-2 text-white tracking-tight">{profissao}</h3>
                    <p className="text-sm text-muted-foreground mb-4 font-inter">
                      Categoria com {leadsInProfissao.length} lead{leadsInProfissao.length !== 1 ? 's' : ''} selecionado{leadsInProfissao.length !== 1 ? 's' : ''}
                    </p>
                    
                    {/* Barra de Progresso */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white/70 font-inter">0% Concluído</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-white/30 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-inter font-semibold tracking-tight text-white">
                        {leadsInProfissao.length}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          acessarCategoria(profissao, 'profissao');
                        }}
                        className="inline-flex items-center justify-center rounded-xl text-sm font-inter font-medium h-9 px-4 bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 hover:scale-105 hover:bg-white/20 active:scale-95"
                      >
                        Acessar
                      </button>
                    </div>
                    
                    <div className="mt-3 flex items-center text-xs text-white/50 font-inter">
                      <div className="w-2 h-2 rounded-full bg-white/30 mr-2"></div>
                      Espaço privado
                    </div>
                  </div>
                </div>
              );

              return (
                <div 
                  key={profissao}
                  onClick={() => acessarCategoria(profissao, 'profissao')}
                >
                  <CardComponent />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dialog de Confirmação */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
          setConfirmDialog(prev => ({ ...prev, open }))
        }>
          <AlertDialogContent className="bg-gray-900/95 backdrop-blur-md border border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Confirmar Acesso - {confirmDialog.categoria}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                {confirmDialog.conflitos.length > 0 && (
                  <>
                    Esta categoria contém {confirmDialog.conflitos.length} lead{confirmDialog.conflitos.length !== 1 ? 's' : ''} que também está{confirmDialog.conflitos.length !== 1 ? 'ão' : ''} em outras categorias.
                    <br /><br />
                    <strong>Leads que serão movidos:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {confirmDialog.conflitos.slice(0, 5).map((lead) => (
                        <li key={lead.id} className="text-sm">
                          {lead.nome} - será removido de "{confirmDialog.tipo === 'profissao' ? lead.etapa : lead.profissao}"
                        </li>
                      ))}
                      {confirmDialog.conflitos.length > 5 && (
                        <li className="text-sm text-gray-400">
                          ... e mais {confirmDialog.conflitos.length - 5} lead{confirmDialog.conflitos.length - 5 !== 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmarRemocao}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Confirmar e Acessar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}