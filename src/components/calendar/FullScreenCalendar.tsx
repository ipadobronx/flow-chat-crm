import * as React from "react";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";

export interface CalendarEvent {
  id: string;
  lead_nome: string;
  lead_telefone: string;
  horario: string;
  datetime: string;
  observacoes?: string | null;
  synced_with_google: boolean;
  status: string;
  lead_etapa?: string;
}

export interface CalendarData {
  day: Date;
  events: CalendarEvent[];
}

interface FullScreenCalendarProps {
  data: CalendarData[];
  onEventClick?: (event: CalendarEvent) => void;
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

// Cores por etapa do funil
const etapaColors: Record<string, string> = {
  'Novo': 'bg-blue-500/20 text-blue-700 border-blue-500',
  'Ligar Depois': 'bg-yellow-500/20 text-yellow-700 border-yellow-500',
  'Tentativa': 'bg-orange-500/20 text-orange-700 border-orange-500',
  'OI': 'bg-purple-500/20 text-purple-700 border-purple-500',
  'Delay OI': 'bg-purple-400/20 text-purple-600 border-purple-400',
  'PC': 'bg-emerald-500/20 text-emerald-700 border-emerald-500',
  'Delay PC': 'bg-emerald-400/20 text-emerald-600 border-emerald-400',
  'N': 'bg-gray-500/20 text-gray-700 border-gray-500',
  'Não': 'bg-red-500/20 text-red-700 border-red-500',
  'Apólice Emitida': 'bg-green-600/20 text-green-800 border-green-600',
};

const getEtapaBadgeColor = (etapa?: string) => {
  if (!etapa) return 'bg-gray-500/20 text-gray-700 border-gray-500';
  return etapaColors[etapa] || 'bg-gray-500/20 text-gray-700 border-gray-500';
};

export function FullScreenCalendar({ data, onEventClick }: FullScreenCalendarProps) {
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy")
  );
  const [showDayDialog, setShowDayDialog] = React.useState(false);
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Cores vibrantes por dia da semana
  const dayColors = [
    "bg-red-500/20 border-l-red-500 hover:bg-red-500/30",      // Domingo
    "bg-blue-500/20 border-l-blue-500 hover:bg-blue-500/30",   // Segunda
    "bg-purple-500/20 border-l-purple-500 hover:bg-purple-500/30", // Terça
    "bg-green-500/20 border-l-green-500 hover:bg-green-500/30",   // Quarta
    "bg-orange-500/20 border-l-orange-500 hover:bg-orange-500/30", // Quinta
    "bg-pink-500/20 border-l-pink-500 hover:bg-pink-500/30",     // Sexta
    "bg-cyan-500/20 border-l-cyan-500 hover:bg-cyan-500/30",     // Sábado
  ];

  const dayDotColors = [
    "bg-red-500",    // Domingo
    "bg-blue-500",   // Segunda
    "bg-purple-500", // Terça
    "bg-green-500",  // Quarta
    "bg-orange-500", // Quinta
    "bg-pink-500",   // Sexta
    "bg-cyan-500",   // Sábado
  ];

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"));
    setSelectedDay(today);
  }

  const selectedDayEvents = data
    .filter((date) => isSameDay(date.day, selectedDay))
    .flatMap((date) => date.events);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    const hasEvents = data.some((date) => isSameDay(date.day, day) && date.events.length > 0);
    if (hasEvents) {
      setShowDayDialog(true);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Calendar Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-muted-foreground">
                {format(today, "MMM", { locale: ptBR })}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">
                {format(firstDayCurrentMonth, "MMMM, yyyy", { locale: ptBR })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(firstDayCurrentMonth, "d 'de' MMM, yyyy", { locale: ptBR })} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "d 'de' MMM, yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Mês anterior"
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
              variant="outline"
            >
              Hoje
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Próximo mês"
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border text-center text-xs font-semibold leading-6 lg:flex-none">
          <div className="border-r py-2.5">Dom</div>
          <div className="border-r py-2.5">Seg</div>
          <div className="border-r py-2.5">Ter</div>
          <div className="border-r py-2.5">Qua</div>
          <div className="border-r py-2.5">Qui</div>
          <div className="border-r py-2.5">Sex</div>
          <div className="py-2.5">Sáb</div>
        </div>

        {/* Calendar Days */}
        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                onClick={() => handleDayClick(day)}
                className={cn(
                  dayIdx === 0 && colStartClasses[getDay(day)],
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "bg-accent/50 text-muted-foreground",
                  "relative flex flex-col border-b border-r hover:bg-muted focus:z-10 cursor-pointer",
                  !isEqual(day, selectedDay) && "hover:bg-accent/75",
                )}
              >
                <header className="flex items-center justify-between p-2.5">
                  <button
                    type="button"
                    className={cn(
                      isEqual(day, selectedDay) && "text-primary-foreground",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        "text-foreground",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-muted-foreground",
                      isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "border-none bg-primary",
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-foreground",
                      (isEqual(day, selectedDay) || isToday(day)) &&
                        "font-semibold",
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border"
                    )}
                  >
                    <time dateTime={format(day, "yyyy-MM-dd")}>
                      {format(day, "d")}
                    </time>
                  </button>
                </header>
                <div className="flex-1 p-2.5 space-y-1.5">
                  {data
                    .filter((event) => isSameDay(event.day, day))
                    .map((dayData) => (
                      <React.Fragment key={dayData.day.toString()}>
                        {dayData.events.slice(0, 2).map((event) => {
                          const eventDay = getDay(new Date(event.datetime));
                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event);
                              }}
                              className={cn(
                                "group relative flex flex-col items-start gap-1 rounded-lg p-2 text-xs leading-tight cursor-pointer transition-all duration-200",
                                "border-l-4 shadow-sm hover:shadow-md",
                                dayColors[eventDay]
                              )}
                            >
                              <div className="flex items-center gap-1.5 w-full">
                                <p className="font-semibold leading-none flex-1 truncate text-foreground">
                                  {event.lead_nome}
                                </p>
                                <div className="flex items-center gap-1">
                                  {event.lead_etapa && (
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-[10px] px-1 py-0 h-4 border",
                                        getEtapaBadgeColor(event.lead_etapa)
                                      )}
                                    >
                                      {event.lead_etapa}
                                    </Badge>
                                  )}
                                  {event.synced_with_google && (
                                    <CalendarIcon className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                              <p className="leading-none text-muted-foreground font-medium">
                                {event.horario}
                              </p>
                            </div>
                          );
                        })}
                        {dayData.events.length > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDayClick(day);
                            }}
                            className="w-full text-xs font-medium text-primary hover:text-primary/80 p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                          >
                            + Ver {dayData.events.length - 2} agendamento{dayData.events.length - 2 > 1 ? 's' : ''}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View */}
          <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x lg:hidden">
            {days.map((day, dayIdx) => (
              <button
                onClick={() => setSelectedDay(day)}
                key={dayIdx}
                type="button"
                className={cn(
                  isEqual(day, selectedDay) && "text-primary-foreground",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    isSameMonth(day, firstDayCurrentMonth) &&
                    "text-foreground",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "text-muted-foreground",
                  (isEqual(day, selectedDay) || isToday(day)) &&
                    "font-semibold",
                  "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10"
                )}
              >
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-full",
                    isEqual(day, selectedDay) &&
                      isToday(day) &&
                      "bg-primary text-primary-foreground",
                    isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </time>
                {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div>
                    {data
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div
                          key={date.day.toString()}
                          className="-mx-0.5 mt-auto flex flex-wrap-reverse gap-0.5"
                        >
                          {date.events.slice(0, 3).map((event) => {
                            const eventDay = getDay(new Date(event.datetime));
                            return (
                              <span
                                key={event.id}
                                className={cn(
                                  "mt-1 h-1.5 w-1.5 rounded-full",
                                  dayDotColors[eventDay]
                                )}
                              />
                            );
                          })}
                          {date.events.length > 3 && (
                            <span className="mt-1 text-[0.6rem] text-primary font-bold">
                              +{date.events.length - 3}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog de agendamentos do dia */}
      {isDesktop && (
        <div
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all",
            showDayDialog ? "block" : "hidden"
          )}
          onClick={() => setShowDayDialog(false)}
        >
          <div
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  Agendamentos - {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedDayEvents.length} agendamento{selectedDayEvents.length !== 1 ? 's' : ''} neste dia
                </p>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {selectedDayEvents.map((event) => {
                  const eventDay = getDay(new Date(event.datetime));
                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        setShowDayDialog(false);
                        onEventClick?.(event);
                      }}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border-l-4 p-3 cursor-pointer transition-all shadow-sm hover:shadow-md",
                        dayColors[eventDay]
                      )}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{event.lead_nome}</p>
                          {event.lead_etapa && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs border",
                                getEtapaBadgeColor(event.lead_etapa)
                              )}
                            >
                              {event.lead_etapa}
                            </Badge>
                          )}
                          {event.synced_with_google && (
                            <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              <CalendarIcon className="h-3 w-3" />
                              Sincronizado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {event.horario} • {event.lead_telefone}
                        </p>
                        {event.observacoes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {event.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setShowDayDialog(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
              >
                <span className="sr-only">Fechar</span>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Day Events (Mobile) */}
      {!isDesktop && selectedDayEvents.length > 0 && (
        <div className="mt-4 space-y-2 px-4 pb-4">
          <h3 className="text-sm font-semibold">
            Agendamentos - {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
          </h3>
          {selectedDayEvents.map((event) => {
            const eventDay = getDay(new Date(event.datetime));
            return (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-l-4 p-3 cursor-pointer transition-all shadow-sm hover:shadow-md",
                  dayColors[eventDay]
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{event.lead_nome}</p>
                    {event.lead_etapa && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs border",
                          getEtapaBadgeColor(event.lead_etapa)
                        )}
                      >
                        {event.lead_etapa}
                      </Badge>
                    )}
                    {event.synced_with_google && (
                      <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        <CalendarIcon className="h-3 w-3" />
                        Sincronizado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {event.horario} • {event.lead_telefone}
                  </p>
                  {event.observacoes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {event.observacoes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
