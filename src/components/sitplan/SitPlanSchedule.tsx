import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Phone, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SitPlanSchedule() {
  const { data: leads = [] } = useQuery({
    queryKey: ["sitplan-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .not("telefone", "is", null)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Generate time slots for Friday (8h to 18h)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Simulate lead assignments to time slots
  const getLeadForSlot = (slotIndex: number) => {
    if (slotIndex < leads.length) {
      return leads[slotIndex];
    }
    return null;
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "Concluído":
        return "✅";
      case "Não Atendeu":
        return "❌";
      default:
        return "⏳";
    }
  };

  const isCurrentSlot = (slotTime: string) => {
    return slotTime === currentTime;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Agenda do Dia
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sexta-feira - Horários das ligações
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {timeSlots.map((slot, index) => {
            const lead = getLeadForSlot(index);
            const isCurrent = isCurrentSlot(slot);
            
            return (
              <div
                key={slot}
                className={`p-3 border-b border-border flex items-center gap-3 ${
                  isCurrent ? "bg-primary/10 border-primary/30" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Clock 
                    className={`w-4 h-4 ${
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    }`} 
                  />
                  <span className={`text-sm font-mono ${
                    isCurrent ? "font-bold text-primary" : "text-foreground"
                  }`}>
                    {slot}
                  </span>
                  
                  {lead ? (
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm truncate font-medium">
                        {lead.nome}
                      </span>
                      <span className="text-xs">
                        {getStatusIcon(lead.status)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Livre
                    </span>
                  )}
                </div>

                {isCurrent && (
                  <Badge variant="outline" className="border-primary text-primary">
                    Agora
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="p-4 border-t bg-muted/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {leads.filter(l => l.status === "Concluído").length}
              </div>
              <div className="text-muted-foreground">Feitas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-warning">
                {leads.filter(l => l.status !== "Concluído").length}
              </div>
              <div className="text-muted-foreground">Pendentes</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}