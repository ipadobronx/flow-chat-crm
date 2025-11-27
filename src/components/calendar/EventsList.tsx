import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Phone, Calendar, ListTodo, ChevronRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ScheduleEvent {
  id: string;
  lead_nome: string;
  lead_telefone: string | null;
  lead_recomendante: string[] | null;
  horario: string;
  datetime: string;
  observacoes: string | null;
  synced_with_google: boolean;
  google_task_id: string | null;
  status: string;
  lead_etapa?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: "needsAction" | "completed";
  isGoogleTask: true;
}

interface EventsListProps {
  selectedDate: Date;
  events: ScheduleEvent[];
  googleTasks?: GoogleTask[];
  onEventClick: (event: ScheduleEvent) => void;
  onTaskClick?: (task: GoogleTask) => void;
  isLoading?: boolean;
  activeView?: "calendar" | "tasks";
}

export const EventsList = ({
  selectedDate,
  events,
  googleTasks = [],
  onEventClick,
  onTaskClick,
  isLoading,
  activeView = "calendar",
}: EventsListProps) => {
  const sortedEvents = [...events].sort((a, b) => a.horario.localeCompare(b.horario));
  
  // Filter google tasks for the selected date
  const filteredGoogleTasks = googleTasks.filter((task) => {
    if (!task.due) return false;
    const taskDate = new Date(task.due);
    return (
      taskDate.getDate() === selectedDate.getDate() &&
      taskDate.getMonth() === selectedDate.getMonth() &&
      taskDate.getFullYear() === selectedDate.getFullYear()
    );
  });
  
  // Also include local agendamentos that have google_task_id (tasks created locally)
  const localTaskEvents = events.filter(e => e.google_task_id);
  
  // Combine Google Tasks with local tasks, avoiding duplicates
  const allTasks: GoogleTask[] = [...filteredGoogleTasks];
  localTaskEvents.forEach(localTask => {
    const alreadyExists = allTasks.some(t => t.id === localTask.google_task_id);
    if (!alreadyExists) {
      allTasks.push({
        id: localTask.google_task_id!,
        title: localTask.lead_nome,
        notes: localTask.observacoes || undefined,
        due: localTask.datetime,
        status: localTask.status === 'realizado' ? 'completed' : 'needsAction',
        isGoogleTask: true,
      });
    }
  });

  const showOnlyTasks = activeView === "tasks";
  const hasContent = showOnlyTasks 
    ? allTasks.length > 0 
    : sortedEvents.length > 0 || allTasks.length > 0;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-4 sm:p-5 md:p-6 h-full min-h-[300px] md:h-[480px] flex flex-col">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex-shrink-0">
        <h2 className="text-xl sm:text-2xl font-light text-white">
          {format(selectedDate, "d", { locale: ptBR })}
        </h2>
        <p className="text-white/50 text-xs sm:text-sm capitalize">
          {format(selectedDate, "EEEE, MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Events/Tasks List with Liquid Glass Scroll */}
      <ScrollArea className="flex-1 max-h-[350px] sm:max-h-[450px] md:max-h-[55vh] pr-2">
        <div className="space-y-2 sm:space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/20 border-t-[#d4ff4a] rounded-full animate-spin" />
          </div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 sm:mb-4">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white/30" />
            </div>
            <p className="text-white/50 text-xs sm:text-sm">
              Nenhum agendamento ou tarefa para este dia
            </p>
          </div>
        ) : (
          <>
            {/* Google Tasks - Always visible */}
            {allTasks.map((task, index) => {
              // Find local event to get extra info (telefone, recomendante)
              const localEvent = events.find(e => e.google_task_id === task.id);
              
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={cn(
                    "group relative bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/30",
                    "rounded-xl sm:rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-300",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <ListTodo className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="text-[10px] sm:text-xs font-medium">Google Task</span>
                        </div>
                      </div>
                      <h3 className="text-white font-medium text-sm sm:text-base truncate mb-1">
                        {task.title}
                      </h3>
                      
                      {/* Recomendante + Telefone */}
                      <div className="flex items-center gap-2 text-white/50 text-[10px] sm:text-xs flex-wrap">
                        {localEvent?.lead_recomendante?.[0] && (
                          <span className="text-amber-400/70">
                            Rec: {localEvent.lead_recomendante[0]}
                          </span>
                        )}
                        {localEvent?.lead_telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span>{localEvent.lead_telefone}</span>
                          </div>
                        )}
                      </div>
                      
                      {task.notes && (
                        <p className="text-white/40 text-[10px] sm:text-xs line-clamp-1 mt-1">
                          {task.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Regular Events - Only in calendar view */}
            {!showOnlyTasks && sortedEvents.filter(event => !event.google_task_id).map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                className={cn(
                  "group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                  "rounded-xl sm:rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-300",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${(allTasks.length + index) * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Time */}
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[#d4ff4a]">
                          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="text-xs sm:text-sm font-medium">{event.horario}</span>
                        </div>
                        {/* Sync Indicators */}
                        <div className="flex items-center gap-1">
                          {event.synced_with_google && (
                            <span title="Sincronizado com Google Calendar">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                            </span>
                          )}
                          {event.google_task_id && (
                            <span title="Task no Google Tasks">
                              <ListTodo className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Lead Name */}
                      <h3 className="text-white font-medium text-sm sm:text-base truncate mb-1">
                        {event.lead_nome}
                      </h3>

                      {/* Phone & Stage */}
                      <div className="flex items-center gap-2 sm:gap-3 text-white/50 text-[10px] sm:text-xs flex-wrap">
                        {event.lead_telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span>{event.lead_telefone}</span>
                          </div>
                        )}
                        {event.lead_etapa && (
                          <Badge 
                            variant="outline" 
                            className="bg-white/5 border-white/10 text-white/70 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0"
                          >
                            {event.lead_etapa}
                          </Badge>
                        )}
                      </div>

                      {/* Observações preview */}
                      {event.observacoes && (
                        <p className="text-white/40 text-[10px] sm:text-xs mt-1.5 sm:mt-2 line-clamp-1">
                          {event.observacoes}
                        </p>
                      )}
                    </div>

                    {/* Status & Arrow */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <Badge
                        variant={event.status === "pendente" ? "default" : "secondary"}
                        className={cn(
                          "text-[8px] sm:text-[10px] px-1.5 sm:px-2",
                          event.status === "pendente"
                            ? "bg-[#d4ff4a]/20 text-[#d4ff4a] border-[#d4ff4a]/30"
                            : "bg-white/10 text-white/70 border-white/20"
                        )}
                      >
                        {event.status}
                      </Badge>
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                  </div>
                </div>
            ))}
          </>
        )}
        </div>
      </ScrollArea>
    </div>
  );
};
