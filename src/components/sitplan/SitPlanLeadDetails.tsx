import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Phone, Calendar, Save, User, Building2, Briefcase, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { LeadHistory } from "./LeadHistory";
import { StageTimeHistory } from "@/components/dashboard/StageTimeHistory";
import { AgendarLigacao } from "@/components/agendamento/AgendarLigacao";

type Lead = Tables<"leads">;

interface SitPlanLeadDetailsProps {
  selectedLead: Lead | null;
  onLeadUpdated: () => void;
}

export function SitPlanLeadDetails({ selectedLead, onLeadUpdated }: SitPlanLeadDetailsProps) {
  const queryClient = useQueryClient();
  const [observations, setObservations] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  if (!selectedLead) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Selecione um Lead</h3>
            <p>Clique em um lead da lista para ver os detalhes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleWhatsApp = () => {
    if (selectedLead.telefone) {
      const cleanPhone = selectedLead.telefone.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá ${selectedLead.nome}, tudo bem?`);
      window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleCall = () => {
    if (selectedLead.telefone) {
      window.open(`tel:${selectedLead.telefone}`, '_self');
    }
  };

  const handleSaveAndComplete = async () => {
    if (!newStatus) {
      toast({
        title: "Erro",
        description: "Selecione um status antes de salvar",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (observations.trim()) {
        updateData.observacoes = observations;
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", selectedLead.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lead atualizado com sucesso!",
      });

      onLeadUpdated();
      setObservations("");
      setNewStatus("");
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o lead",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Detalhes do Lead
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Lead Header */}
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={`https://source.unsplash.com/64x64/?person,face&${selectedLead.id}`} />
            <AvatarFallback className="text-lg">{selectedLead.nome.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{selectedLead.nome}</h3>
            {selectedLead.empresa && (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                <span>{selectedLead.empresa}</span>
              </div>
            )}
            {selectedLead.profissao && (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <Briefcase className="w-4 h-4" />
                <span>{selectedLead.profissao}</span>
              </div>
            )}
            {selectedLead.high_ticket && (
              <Badge variant="destructive" className="mt-2">High Ticket</Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-2">
          <h4 className="font-medium">Informações de Contato</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {selectedLead.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{selectedLead.telefone}</span>
              </div>
            )}
            {selectedLead.recomendante && (
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                <span>Recomendado por: {selectedLead.recomendante}</span>
              </div>
            )}
            {selectedLead.valor && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary">Valor: R$ {selectedLead.valor}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="font-medium">Ações Rápidas</h4>
          <div className="flex gap-2">
            <Button 
              onClick={handleWhatsApp}
              className="flex-1"
              variant="outline"
              disabled={!selectedLead.telefone}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              onClick={handleCall}
              className="flex-1"
              variant="outline"
              disabled={!selectedLead.telefone}
            >
              <Phone className="w-4 h-4 mr-2" />
              Ligar
            </Button>
            <AgendarLigacao 
              leadId={selectedLead.id}
              leadNome={selectedLead.nome}
              onAgendamentoCriado={() => {
                queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Status Update */}
        <div className="space-y-4">
          <h4 className="font-medium">Status Pós-Ligação</h4>
          
          <RadioGroup value={newStatus} onValueChange={setNewStatus}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Concluído" id="feito" />
              <Label htmlFor="feito" className="flex items-center gap-2">
                ✅ Feito
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Não Atendeu" id="nao-atendeu" />
              <Label htmlFor="nao-atendeu" className="flex items-center gap-2">
                ❌ Não atendeu
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Reagendar" id="reagendar" />
              <Label htmlFor="reagendar" className="flex items-center gap-2">
                📅 Reagendar
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Observations */}
        <div className="space-y-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            placeholder="Adicione observações sobre a ligação..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
          />
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSaveAndComplete}
          className="w-full"
          disabled={isUpdating}
        >
          <Save className="w-4 h-4 mr-2" />
          {isUpdating ? "Salvando..." : "Salvar e Marcar como Concluído"}
        </Button>

        <Separator />

        {/* Stage Time History */}
        <StageTimeHistory leadId={selectedLead.id} showLeadName={false} limit={10} />

        <Separator />

        {/* Lead History */}
        <LeadHistory leadId={selectedLead.id} />
      </CardContent>
    </Card>
  );
}