import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageSquare, Calendar, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable,
  arrayMove 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const stages = [
  { name: "Novo", color: "bg-blue-500" },
  { name: "OI", color: "bg-indigo-500" },
  { name: "Delay OI", color: "bg-yellow-500" },
  { name: "PC", color: "bg-orange-500" },
  { name: "Delay PC", color: "bg-red-500" },
  { name: "N", color: "bg-purple-500" },
  { name: "Apólice Emitida", color: "bg-green-500" },
  { name: "Apólice Entregue", color: "bg-emerald-500" },
  { name: "C2", color: "bg-teal-500" },
  { name: "Delay C2", color: "bg-cyan-500" },
  { name: "Ligar Depois", color: "bg-pink-500" },
  { name: "Não", color: "bg-gray-500" },
  { name: "Proposta Cancelada", color: "bg-red-600" },
  { name: "Apólice Cancelada", color: "bg-red-700" }
];

type Lead = {
  id: string;
  nome: string;
  empresa: string | null;
  valor: string | null;
  telefone: string | null;
  profissao: string | null;
  recomendante: string | null;
  etapa: string;
  status: string | null;
  data_callback: string | null;
  high_ticket: boolean;
  casado: boolean;
  tem_filhos: boolean;
  avisado: boolean;
  incluir_sitplan: boolean;
  observacoes: string | null;
  pa_estimado: string | null;
  data_sitplan: string | null;
};

// Componente para card arrastável
function DraggableLeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id.toString() });

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
      className={`p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all select-none cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 scale-105 ring-2 ring-primary shadow-lg z-50' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) {
          onClick();
        }
      }}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={`https://source.unsplash.com/40x40/?portrait&sig=${lead.id}`} />
          <AvatarFallback>{lead.nome.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{lead.nome}</p>
          <p className="text-xs text-muted-foreground">{lead.empresa}</p>
          <p className="text-sm font-semibold text-success mt-1">{lead.valor}</p>
        </div>
      </div>
    </div>
  );
}

// Componente para área droppable
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-all duration-200 ${isOver ? 'bg-primary/5 ring-2 ring-primary ring-dashed rounded-lg' : ''}`}
    >
      {children}
    </div>
  );
}

export default function Pipeline() {
  const { user } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Buscar leads do Supabase
  useEffect(() => {
    async function fetchLeads() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;
        setLeads(data || []);
      } catch (error) {
        console.error('Erro ao buscar leads:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, [user]);

  // Organizar leads por etapa
  const getLeadsByStage = (stageName: string) => {
    return leads.filter(lead => lead.etapa === stageName);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
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
    
    // Atualizar no Supabase
    try {
      const { error } = await supabase
        .from('leads')
        .update({ etapa: overId as any })
        .eq('id', activeId);

      if (error) throw error;

      // Atualizar estado local
      setLeads(prev => prev.map(lead => 
        lead.id === activeId 
          ? { ...lead, etapa: overId as any }
          : lead
      ));
      
      console.log(`Moving ${draggedLead.nome} from ${draggedLead.etapa} to ${overId}`);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
    }
    
    setActiveId(null);
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
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Kanban board for lead management</p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {loading ? (
            <div className="text-center py-8">Carregando leads...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stages.slice(0, 14).map((stage) => {
                const stageLeads = getLeadsByStage(stage.name);
                return (
                  <DroppableColumn key={stage.name} id={stage.name}>
                    <Card className="h-fit">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-medium">{stage.name}</CardTitle>
                          <Badge variant="secondary">{stageLeads.length}</Badge>
                        </div>
                        <div className={`w-full h-1 rounded-full ${stage.color}`} />
                      </CardHeader>
                      <SortableContext 
                        items={stageLeads.map(lead => lead.id)}
                        strategy={verticalListSortingStrategy}
                        id={stage.name}
                      >
                        <CardContent className="space-y-3 min-h-[200px]">
                          {stageLeads.map((lead) => (
                            <DraggableLeadCard
                              key={lead.id}
                              lead={lead}
                              onClick={() => setSelectedLead(lead)}
                            />
                          ))}
                        </CardContent>
                      </SortableContext>
                    </Card>
                  </DroppableColumn>
                );
              })}
            </div>
          )}
          
          <DragOverlay>
            {activeId ? (
              <div className="p-3 rounded-lg bg-muted/50 shadow-lg ring-2 ring-primary">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`https://source.unsplash.com/40x40/?portrait&sig=${activeId}`} />
                    <AvatarFallback>LD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Moving...</p>
                    <p className="text-xs text-muted-foreground">Dragging lead</p>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Dialog com informações detalhadas do lead */}
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedLead?.nome}`} />
                  <AvatarFallback>{selectedLead?.nome?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">👤 {selectedLead?.nome}</p>
                  <p className="text-sm text-muted-foreground">Recomendação</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-6">
                {/* Botões de ação */}
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp Abordagem Lead
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp Abordagem Lead
                  </Button>
                  <Button size="sm" variant="outline">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Incluir no Próximo Sit Plan
                  </Button>
                  <Button size="sm" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ligar Depois DOLA AI
                  </Button>
                </div>

                {/* Informações básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Nome</Label>
                    <p className="font-medium">{selectedLead.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Recomendante</Label>
                    <p className="font-medium">{selectedLead.recomendante}</p>
                  </div>
                </div>

                {/* Selects de etapa e status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Etapa Funil *</Label>
                    <Select defaultValue={selectedLead.etapa}>
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
                    <Select defaultValue={selectedLead.status || ""}>
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
                  <Input type="date" defaultValue={selectedLead.data_callback || ""} />
                </div>

                {/* Celular e Profissão */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Celular</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={selectedLead.telefone || ""} readOnly />
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Profissão</Label>
                    <Input value={selectedLead.profissao || ""} readOnly />
                  </div>
                </div>

                {/* Campos Yes/No */}
                <div className="space-y-2">
                  <YesNoField label="HighTicket" value={selectedLead.high_ticket} />
                  <YesNoField label="Casado(a)" value={selectedLead.casado} />
                  <YesNoField label="Filhos" value={selectedLead.tem_filhos} />
                  <YesNoField label="Avisado" value={selectedLead.avisado} />
                  <YesNoField label="Incluir no SitPlan?" value={selectedLead.incluir_sitplan} />
                </div>

                {/* Observações */}
                <div>
                  <Label className="text-sm text-muted-foreground">Observações</Label>
                  <Textarea 
                    defaultValue={selectedLead.observacoes || ""} 
                    placeholder="Adicione observações sobre o lead..."
                    className="mt-1"
                  />
                </div>

                {/* PA Estimado */}
                <div>
                  <Label className="text-sm text-muted-foreground">PA Estimado</Label>
                  <Input defaultValue={selectedLead.pa_estimado || ""} />
                </div>

                {/* SitPlan */}
                <div>
                  <Label className="text-sm text-muted-foreground">SitPlan</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="date" defaultValue={selectedLead.data_sitplan || ""} />
                    <Button size="sm" variant="outline">+</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}