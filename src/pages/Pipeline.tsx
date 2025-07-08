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
import { useState } from "react";
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const stages = [
  { name: "New Leads", count: 12, color: "bg-blue-500" },
  { name: "Contacted", count: 8, color: "bg-yellow-500" },
  { name: "Qualified", count: 5, color: "bg-orange-500" },
  { name: "Proposal", count: 3, color: "bg-purple-500" },
  { name: "Closed Won", count: 2, color: "bg-green-500" }
];

const leads = {
  "New Leads": [
    { 
      id: 1, 
      name: "Geórgia Brito", 
      company: "Tech Corp", 
      value: "$15,000",
      phone: "(81)99973-6944",
      profession: "Enfermeira",
      referrer: "Sabrina Medeiros",
      stage: "NOVO",
      status: "Ligar Depois",
      callbackDate: "2025-01-10",
      highTicket: true,
      married: true,
      hasChildren: true,
      notified: true,
      includeSitPlan: false,
      observations: "Enfermeira. Mae de Valentina.",
      estimatedPA: "-",
      sitPlanDate: "04/07/2025"
    },
    { 
      id: 2, 
      name: "Jane Smith", 
      company: "StartupX", 
      value: "$8,500",
      phone: "(11)98765-4321",
      profession: "Designer",
      referrer: "Maria Silva",
      stage: "NOVO",
      status: "Aguardando Retorno",
      callbackDate: "2025-01-12",
      highTicket: false,
      married: false,
      hasChildren: false,
      notified: true,
      includeSitPlan: true,
      observations: "Interessada em design de interiores.",
      estimatedPA: "R$ 5.000",
      sitPlanDate: "15/07/2025"
    }
  ],
  "Contacted": [
    { 
      id: 3, 
      name: "Bob Johnson", 
      company: "BigCo", 
      value: "$25,000",
      phone: "(21)99887-6655",
      profession: "Engenheiro",
      referrer: "Carlos Santos",
      stage: "CONTACTADO",
      status: "Agendado",
      callbackDate: "2025-01-08",
      highTicket: true,
      married: true,
      hasChildren: true,
      notified: true,
      includeSitPlan: true,
      observations: "Muito interessado no projeto.",
      estimatedPA: "R$ 20.000",
      sitPlanDate: "20/06/2025"
    },
    { 
      id: 4, 
      name: "Alice Brown", 
      company: "Growth Ltd", 
      value: "$12,000",
      phone: "(31)99123-4567",
      profession: "Advogada",
      referrer: "Ana Costa",
      stage: "CONTACTADO",
      status: "Em Negociação",
      callbackDate: "2025-01-15",
      highTicket: true,
      married: false,
      hasChildren: false,
      notified: true,
      includeSitPlan: true,
      observations: "Precisa de mais informações sobre o ROI.",
      estimatedPA: "R$ 8.000",
      sitPlanDate: "10/08/2025"
    }
  ],
  "Qualified": [
    { 
      id: 5, 
      name: "Charlie Wilson", 
      company: "Enterprise Inc", 
      value: "$45,000",
      phone: "(41)99456-7890",
      profession: "CEO",
      referrer: "Roberto Lima",
      stage: "QUALIFICADO",
      status: "Proposta Enviada",
      callbackDate: "2025-01-20",
      highTicket: true,
      married: true,
      hasChildren: true,
      notified: true,
      includeSitPlan: true,
      observations: "Decisor principal da empresa.",
      estimatedPA: "R$ 30.000",
      sitPlanDate: "01/09/2025"
    }
  ],
  "Proposal": [
    { 
      id: 6, 
      name: "Diana Davis", 
      company: "Scale Co", 
      value: "$32,000",
      phone: "(51)99321-0987",
      profession: "Diretora",
      referrer: "Fernanda Rocha",
      stage: "PROPOSTA",
      status: "Aguardando Assinatura",
      callbackDate: "2025-01-25",
      highTicket: true,
      married: true,
      hasChildren: false,
      notified: true,
      includeSitPlan: true,
      observations: "Pronta para fechar o negócio.",
      estimatedPA: "R$ 25.000",
      sitPlanDate: "15/09/2025"
    }
  ],
  "Closed Won": [
    { 
      id: 7, 
      name: "Eva Martinez", 
      company: "Success Corp", 
      value: "$18,000",
      phone: "(61)99654-3210",
      profession: "Gerente",
      referrer: "Lucas Oliveira",
      stage: "FECHADO",
      status: "Contrato Assinado",
      callbackDate: "",
      highTicket: true,
      married: true,
      hasChildren: true,
      notified: true,
      includeSitPlan: true,
      observations: "Cliente satisfeita com o resultado.",
      estimatedPA: "R$ 15.000",
      sitPlanDate: "01/10/2025"
    }
  ]
};

// Componente para área droppable
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary ring-dashed' : ''}`}
    >
      {children}
    </div>
  );
}

// Componente para card arrastável
function DraggableLeadCard({ lead, onClick }: { lead: any; onClick: () => void }) {
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

  // Separar handlers de drag e click
  const handleClick = (e: React.MouseEvent) => {
    // Só executa click se não estiver arrastando
    if (!isDragging) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all select-none ${
        isDragging ? 'opacity-50 scale-105 ring-2 ring-primary shadow-lg z-50' : 'cursor-pointer'
      }`}
    >
      {/* Handle para arrastar */}
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="flex items-start space-x-3" onClick={handleClick}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={`https://source.unsplash.com/40x40/?portrait&sig=${lead.id}`} />
            <AvatarFallback>{lead.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{lead.name}</p>
            <p className="text-xs text-muted-foreground">{lead.company}</p>
            <p className="text-sm font-semibold text-success mt-1">{lead.value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState({
    "New Leads": leads["New Leads"],
    "Contacted": leads["Contacted"], 
    "Qualified": leads["Qualified"],
    "Proposal": leads["Proposal"],
    "Closed Won": leads["Closed Won"]
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Encontrar qual lead está sendo movido e de qual coluna
    let sourceLead: any = null;
    let sourceColumn: string = "";
    
    Object.entries(columns).forEach(([columnName, columnLeads]) => {
      const foundLead = columnLeads.find((lead: any) => lead.id.toString() === activeId);
      if (foundLead) {
        sourceLead = foundLead;
        sourceColumn = columnName;
      }
    });
    
    if (!sourceLead) return;
    
    // Se overId é um nome de coluna (droppable), mover para essa coluna
    const targetColumn = Object.keys(columns).find(col => col === overId) || sourceColumn;
    
    if (sourceColumn !== targetColumn) {
      setColumns(prev => {
        const newColumns = { ...prev };
        
        // Remover da coluna origem
        newColumns[sourceColumn as keyof typeof prev] = prev[sourceColumn as keyof typeof prev].filter(
          (lead: any) => lead.id.toString() !== activeId
        );
        
        // Adicionar na coluna destino
        newColumns[targetColumn as keyof typeof prev] = [
          ...prev[targetColumn as keyof typeof prev],
          sourceLead
        ];
        
        return newColumns;
      });
      
      console.log(`Moving ${sourceLead.name} from ${sourceColumn} to ${targetColumn}`);
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
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stages.map((stage) => (
              <DroppableColumn key={stage.name} id={stage.name}>
                <Card className="h-fit">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                      <Badge variant="secondary">{columns[stage.name as keyof typeof columns]?.length || 0}</Badge>
                    </div>
                    <div className={`w-full h-1 rounded-full ${stage.color}`} />
                  </CardHeader>
                  <SortableContext 
                    items={columns[stage.name as keyof typeof columns]?.map(lead => lead.id) || []}
                    strategy={verticalListSortingStrategy}
                    id={stage.name}
                  >
                    <CardContent className="space-y-3 min-h-[200px]">
                      {columns[stage.name as keyof typeof columns]?.map((lead) => (
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
            ))}
          </div>
          
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
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedLead?.name}`} />
                  <AvatarFallback>{selectedLead?.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">👤 {selectedLead?.name}</p>
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
                    <p className="font-medium">{selectedLead.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Recomendante</Label>
                    <p className="font-medium">{selectedLead.referrer}</p>
                  </div>
                </div>

                {/* Selects de etapa e status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Etapa Funil *</Label>
                    <Select defaultValue={selectedLead.stage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOVO">🙂 NOVO</SelectItem>
                        <SelectItem value="CONTACTADO">📞 CONTACTADO</SelectItem>
                        <SelectItem value="QUALIFICADO">✅ QUALIFICADO</SelectItem>
                        <SelectItem value="PROPOSTA">📋 PROPOSTA</SelectItem>
                        <SelectItem value="FECHADO">🎉 FECHADO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <Select defaultValue={selectedLead.status}>
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
                  <Input type="date" defaultValue={selectedLead.callbackDate} />
                </div>

                {/* Celular e Profissão */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Celular</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={selectedLead.phone} readOnly />
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
                    <Input value={selectedLead.profession} readOnly />
                  </div>
                </div>

                {/* Campos Yes/No */}
                <div className="space-y-2">
                  <YesNoField label="HighTicket" value={selectedLead.highTicket} />
                  <YesNoField label="Casado(a)" value={selectedLead.married} />
                  <YesNoField label="Filhos" value={selectedLead.hasChildren} />
                  <YesNoField label="Avisado" value={selectedLead.notified} />
                  <YesNoField label="Incluir no SitPlan?" value={selectedLead.includeSitPlan} />
                </div>

                {/* Observações */}
                <div>
                  <Label className="text-sm text-muted-foreground">Observações</Label>
                  <Textarea 
                    defaultValue={selectedLead.observations} 
                    placeholder="Adicione observações sobre o lead..."
                    className="mt-1"
                  />
                </div>

                {/* PA Estimado */}
                <div>
                  <Label className="text-sm text-muted-foreground">PA Estimado</Label>
                  <Input defaultValue={selectedLead.estimatedPA} />
                </div>

                {/* SitPlan */}
                <div>
                  <Label className="text-sm text-muted-foreground">SitPlan</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="date" defaultValue={selectedLead.sitPlanDate} />
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