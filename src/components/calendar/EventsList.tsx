import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Phone, Calendar, ListTodo, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ScheduleEvent {
  id: string;
  lead_nome: string;
  lead_telefone: string | null;
  horario: string;
  datetime: string;
  observacoes: string | null;
  synced_with_google: boolean;
  google_task_id: string | null;
  status: string;
  lead_etapa?: string;
}

interface EventsListProps {
  selectedDate: Date;
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
  isLoading?: boolean;
}

export const EventsList = ({
  selectedDate,
  events,
  onEventClick,
  isLoading,
}: EventsListProps) => {
  const sortedEvents = [...events].sort((a, b) => a.horario.localeCompare(b.horario));

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-light text-white">
          {format(selectedDate, "d", { locale: ptBR })}
        </h2>
        <p className="text-white/50 text-sm capitalize">
          {format(selectedDate, "EEEE, MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-[#d4ff4a] rounded-full animate-spin" />
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-white/30" />
            </div>
            <p className="text-white/50 text-sm">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          sortedEvents.map((event, index) => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={cn(
                "group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                "rounded-2xl p-4 cursor-pointer transition-all duration-300",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Time */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-[#d4ff4a]">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">{event.horario}</span>
                    </div>
                    {/* Sync Indicators */}
                    <div className="flex items-center gap-1">
                      {event.synced_with_google && (
                        <span title="Sincronizado com Google Calendar">
                          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                        </span>
                      )}
                      {event.google_task_id && (
                        <span title="Task no Google Tasks">
                          <ListTodo className="h-3.5 w-3.5 text-amber-400" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lead Name */}
                  <h3 className="text-white font-medium text-base truncate mb-1">
                    {event.lead_nome}
                  </h3>

                  {/* Phone & Stage */}
                  <div className="flex items-center gap-3 text-white/50 text-xs">
                    {event.lead_telefone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{event.lead_telefone}</span>
                      </div>
                    )}
                    {event.lead_etapa && (
                      <Badge 
                        variant="outline" 
                        className="bg-white/5 border-white/10 text-white/70 text-[10px] px-2 py-0"
                      >
                        {event.lead_etapa}
                      </Badge>
                    )}
                  </div>

                  {/* Observações preview */}
                  {event.observacoes && (
                    <p className="text-white/40 text-xs mt-2 line-clamp-1">
                      {event.observacoes}
                    </p>
                  )}
                </div>

                {/* Status & Arrow */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={event.status === "pendente" ? "default" : "secondary"}
                    className={cn(
                      "text-[10px] px-2",
                      event.status === "pendente"
                        ? "bg-[#d4ff4a]/20 text-[#d4ff4a] border-[#d4ff4a]/30"
                        : "bg-white/10 text-white/70 border-white/20"
                    )}
                  >
                    {event.status}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
