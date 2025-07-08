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

export default function Pipeline() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [draggedLead, setDraggedLead] = useState<any>(null);
  const [draggedFrom, setDraggedFrom] = useState<string>("");

  const handleDragStart = (e: React.DragEvent, lead: any, stage: string) => {
    setDraggedLead(lead);
    setDraggedFrom(stage);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (draggedLead && draggedFrom !== targetStage) {
      // Aqui você pode implementar a lógica para mover o lead entre estágios
      console.log(`Moving ${draggedLead.name} from ${draggedFrom} to ${targetStage}`);
    }
    setDraggedLead(null);
    setDraggedFrom("");
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stages.map((stage) => (
            <Card 
              key={stage.name} 
              className="h-fit"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                  <Badge variant="secondary">{stage.count}</Badge>
                </div>
                <div className={`w-full h-1 rounded-full ${stage.color}`} />
              </CardHeader>
              <CardContent className="space-y-3">
                {leads[stage.name as keyof typeof leads]?.map((lead) => (
                  <div 
                    key={lead.id} 
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead, stage.name)}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.name}`} />
                        <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                        <p className="text-sm font-semibold text-success mt-1">{lead.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

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