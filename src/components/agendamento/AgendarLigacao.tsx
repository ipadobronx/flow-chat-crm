import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LiquidGlassTextarea from "@/components/ui/liquid-textarea";
import { CalendarIcon, Clock, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [createTask, setCreateTask] = useState(false);

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

      // Sincronizar com Google Calendar se conectado (com opção de criar tarefa)
      if (isConnected && data) {
        syncAgendamento(data.id, createTask);
      }

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setObservacoes("");
      setCreateTask(false);
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
        <button className="w-full h-9 px-4 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Agendar Ligação
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border border-white/20 bg-[#1a1a1a]/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Agendar Ligação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-white/70">Lead</Label>
            <p className="text-sm text-white">{leadNome}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full h-10 px-4 rounded-2xl border border-border/40 dark:border-white/30 bg-border/10 dark:bg-white/10 backdrop-blur-md text-left flex items-center gap-2 transition-colors hover:bg-white/20",
                    !selectedDate && "text-white/50",
                    selectedDate && "text-white"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-white/70" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border border-white/20 bg-[#1a1a1a]/95 backdrop-blur-xl" align="start">
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
            <Label className="text-white/70">Horário</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full h-10 rounded-2xl border border-border/40 dark:border-white/30 bg-border/10 dark:bg-white/10 backdrop-blur-md text-white">
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-white/20 bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl max-h-[200px]">
                {timeOptions.map((time) => (
                  <SelectItem 
                    key={time} 
                    value={time}
                    className="text-white/90 focus:bg-white/10 focus:text-white"
                  >
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Observações (opcional)</Label>
            <LiquidGlassTextarea
              placeholder="Observações sobre a ligação..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-[80px] text-white placeholder:text-white/50"
            />
          </div>

          {/* Opção de criar tarefa no Google Tasks */}
          {isConnected && (
            <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
              <Checkbox 
                id="create-task" 
                checked={createTask}
                onCheckedChange={(checked) => setCreateTask(checked === true)}
                className="border-white/30 data-[state=checked]:bg-[#d4ff4a] data-[state=checked]:border-[#d4ff4a] data-[state=checked]:text-black"
              />
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-white/70" />
                <Label 
                  htmlFor="create-task" 
                  className="text-sm font-normal cursor-pointer text-white/70"
                >
                  Criar também no Google Tasks
                </Label>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="h-10 px-6 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAgendar}
              disabled={isLoading || !selectedDate || !selectedTime}
              className="h-10 px-6 rounded-full bg-[#d4ff4a] text-black font-medium hover:bg-[#c9f035] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Agendando..." : "Agendar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
