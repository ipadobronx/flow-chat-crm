import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LiquidGlassTextarea from "@/components/ui/liquid-textarea";
import { CalendarIcon, ListTodo, Loader2 } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface AgendamentoPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadNome: string;
  existingDate?: string;
  existingTime?: string;
  onAgendamentoCriado?: (data: { date: string; time: string; observacoes?: string }) => void;
}

export function AgendamentoPopup({
  open,
  onOpenChange,
  leadId,
  leadNome,
  existingDate,
  existingTime,
  onAgendamentoCriado,
}: AgendamentoPopupProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isConnected, syncAgendamento } = useGoogleCalendar();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    existingDate ? new Date(existingDate.split("T")[0]) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(existingTime || "");
  const [observacoes, setObservacoes] = useState("");
  const [createTask, setCreateTask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  // Update state when props change
  useEffect(() => {
    if (existingDate) {
      setSelectedDate(new Date(existingDate.split("T")[0]));
    }
    if (existingTime) {
      setSelectedTime(existingTime);
    }
  }, [existingDate, existingTime]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setObservacoes("");
      setCreateTask(false);
      setShowFullCalendar(false);
    }
  }, [open]);

  const timeOptions = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00",
  ];

  const handleAgendar = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast.error("Por favor, selecione uma data e horário");
      return;
    }

    setIsLoading(true);

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(":");
      const dataAgendamento = new Date(selectedDate);
      dataAgendamento.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data, error } = await supabase
        .from("agendamentos_ligacoes")
        .insert({
          user_id: user.id,
          lead_id: leadId,
          data_agendamento: dataAgendamento.toISOString(),
          observacoes: observacoes || null,
          status: "pendente",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(
        `Ligação agendada para ${format(dataAgendamento, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
      );

      // Sync with Google Calendar if connected
      if (isConnected && data) {
        syncAgendamento(data.id, createTask);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["agendamento-lead", leadId] });

      // Callback
      onAgendamentoCriado?.({
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        observacoes,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao agendar ligação:", error);
      toast.error("Erro ao agendar ligação");
    } finally {
      setIsLoading(false);
    }
  };

  const quickDays = Array.from({ length: 6 }).map((_, idx) => {
    const dayDate = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), idx + 1);
    return {
      date: dayDate,
      dayNum: format(dayDate, "d"),
      weekLabel: format(dayDate, "EEE", { locale: ptBR }),
      isSelected: selectedDate ? format(selectedDate, "yyyy-MM-dd") === format(dayDate, "yyyy-MM-dd") : false,
    };
  });

  const content = (
    <div className="space-y-4 sm:space-y-5">
      {/* Lead name */}
      <div className="text-center sm:text-left">
        <p className="text-sm text-muted-foreground">Lead</p>
        <p className="font-medium text-foreground">{leadNome}</p>
      </div>

      {/* Quick day selection */}
      <div>
        <Label className="text-sm mb-2 block">Data</Label>
        <div className="grid grid-cols-6 gap-2">
          {quickDays.map(({ date, dayNum, weekLabel, isSelected }) => (
            <button
              key={dayNum + weekLabel}
              type="button"
              className={cn(
                "text-center p-2 sm:p-3 rounded-2xl transition-all duration-200",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setSelectedDate(date)}
            >
              <div className="font-medium text-sm">{dayNum}</div>
              <div className="text-xs capitalize">{weekLabel}</div>
            </button>
          ))}
        </div>

        {/* Full calendar button */}
        <div className="flex justify-end mt-3">
          <Popover open={showFullCalendar} onOpenChange={setShowFullCalendar}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Mais datas</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setShowFullCalendar(false);
                }}
                locale={ptBR}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Time selection */}
      <div>
        <Label className="text-sm mb-2 block">Horário</Label>
        <select
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <option value="">Selecione um horário</option>
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      {/* Observations */}
      <div>
        <Label className="text-sm mb-2 block">Observações (opcional)</Label>
        <LiquidGlassTextarea
          placeholder="Observações sobre a ligação..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Google Tasks option */}
      {isConnected && (
        <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
          <Checkbox
            id="create-task-popup"
            checked={createTask}
            onCheckedChange={(checked) => setCreateTask(checked === true)}
          />
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <Label
              htmlFor="create-task-popup"
              className="text-sm font-normal cursor-pointer"
            >
              Criar também no Google Tasks
            </Label>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleAgendar}
          disabled={isLoading || !selectedDate || !selectedTime}
          className="flex-1 bg-[#d4ff4a] text-black hover:bg-[#c9f035]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Agendando...
            </>
          ) : (
            "Agendar"
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle>Agendar Ligação</DrawerTitle>
            <DrawerDescription>Selecione data e horário para o contato</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar Ligação</DialogTitle>
          <DialogDescription>Selecione data e horário para o contato</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
