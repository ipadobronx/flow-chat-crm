import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, Calendar as CalendarGoogleIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface AgendarLigacaoProps {
  leadId: string;
  leadNome: string;
  onAgendamentoCriado?: () => void;
}

export function AgendarLigacao({ leadId, leadNome, onAgendamentoCriado }: AgendarLigacaoProps) {
  const { user } = useAuth();
  const { isConnected, syncAgendamento } = useGoogleCalendar();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");

  // Opções de horário (08:00 às 18:00)
  const timeOptions = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00"
  ];

  const handleAgendar = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast.error("Por favor, selecione uma data e horário");
      return;
    }

    setIsLoading(true);

    try {
      // Combinar data e hora
      const [hours, minutes] = selectedTime.split(':');
      const dataAgendamento = new Date(selectedDate);
      dataAgendamento.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data, error } = await supabase
        .from('agendamentos_ligacoes')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          data_agendamento: dataAgendamento.toISOString(),
          observacoes: observacoes || null,
          status: 'pendente'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Ligação agendada para ${format(dataAgendamento, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);

      // Sincronizar com Google Calendar se conectado
      if (isConnected && data) {
        syncAgendamento(data.id);
      }

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setObservacoes("");
      setIsOpen(false);
      
      onAgendamentoCriado?.();
    } catch (error) {
      console.error('Erro ao agendar ligação:', error);
      toast.error("Erro ao agendar ligação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Clock className="h-4 w-4 mr-2" />
          Agendar Ligação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar Ligação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Lead</Label>
            <p className="text-sm text-muted-foreground">{leadNome}</p>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Horário</Label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione um horário</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Observações sobre a ligação..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAgendar}
              disabled={isLoading || !selectedDate || !selectedTime}
            >
              {isLoading ? "Agendando..." : "Agendar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}