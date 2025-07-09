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
import type { Database } from "@/integrations/supabase/types";
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent
} from "@dnd-kit/core";
import { 
  useSortable
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
  etapa: Database["public"]["Enums"]["etapa_funil"];
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
  } = useSortable({ id: lead.id });

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
        // Só chama onClick se não estiver sendo arrastado
        if (!isDragging) {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
      onPointerDown={(e) => {
        // Previne conflito entre drag e click
        e.stopPropagation();
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
      className={`transition-all duration-200 h-full ${isOver ? 'bg-primary/10 ring-2 ring-primary/50 ring-dashed rounded-lg' : ''}`}
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
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

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
    console.log('Drag started:', event.active.id);
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag ended:', { activeId: active.id, overId: over?.id });
    
    if (!over) {
      console.log('No drop target found');
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
        .update({ etapa: overId as Database["public"]["Enums"]["etapa_funil"] })
        .eq('id', activeId);

      if (error) throw error;

      // Atualizar estado local
      setLeads(prev => prev.map(lead => 
        lead.id === activeId 
          ? { ...lead, etapa: overId as Database["public"]["Enums"]["etapa_funil"] }
          : lead
      ));
      
      console.log(`Moving ${draggedLead.nome} from ${draggedLead.etapa} to ${overId}`);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
    }
    
    setActiveId(null);
  };

  const handleSaveLead = async () => {
    if (!editingLead) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          etapa: editingLead.etapa as Database["public"]["Enums"]["etapa_funil"],
          status: editingLead.status,
          data_callback: editingLead.data_callback,
          observacoes: editingLead.observacoes,
          pa_estimado: editingLead.pa_estimado,
          data_sitplan: editingLead.data_sitplan,
          high_ticket: editingLead.high_ticket,
          casado: editingLead.casado,
          tem_filhos: editingLead.tem_filhos,
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
      console.log('Lead saved successfully');
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    } finally {
      setSaving(false);
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
          onDragOver={(event: DragOverEvent) => {
            console.log('Drag over:', event.over?.id);
          }}
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
                      <CardContent className="space-y-3 min-h-[200px]">
                        {stageLeads.map((lead) => (
                          <DraggableLeadCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => setSelectedLead(lead)}
                          />
                        ))}
                      </CardContent>
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
        <Dialog open={!!selectedLead} onOpenChange={() => {
          setSelectedLead(null);
          setEditingLead(null);
        }}>
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
                        onClick={() => {
                          const updatedLead = { ...selectedLead, incluir_sitplan: false };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ❌ Não
                      </Button>
                      <Button
                        size="sm"
                        variant={editingLead?.incluir_sitplan === true || (!editingLead && selectedLead.incluir_sitplan) ? "default" : "outline"}
                        onClick={() => {
                          const updatedLead = { ...selectedLead, incluir_sitplan: true };
                          setEditingLead(updatedLead);
                        }}
                      >
                        ✅ Sim
                      </Button>
                    </div>
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

                {/* Botão Salvar */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedLead(null);
                      setEditingLead(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveLead}
                    disabled={saving || !editingLead}
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}