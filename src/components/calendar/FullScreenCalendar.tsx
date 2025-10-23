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

export function FullScreenCalendar({ data, onEventClick }: FullScreenCalendarProps) {
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy")
  );
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
  const isDesktop = useMediaQuery("(min-width: 768px)");

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
                onClick={() => setSelectedDay(day)}
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
                <div className="flex-1 p-2.5">
                  {data
                    .filter((event) => isSameDay(event.day, day))
                    .map((dayData) => (
                      <div key={dayData.day.toString()} className="space-y-1.5">
                        {dayData.events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                            className="flex flex-col items-start gap-1 rounded-lg border bg-muted/50 p-2 text-xs leading-tight hover:bg-muted cursor-pointer"
                          >
                            <div className="flex items-center gap-1 w-full">
                              <p className="font-medium leading-none flex-1 truncate">
                                {event.lead_nome}
                              </p>
                              {event.synced_with_google && (
                                <CalendarIcon className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <p className="leading-none text-muted-foreground">
                              {event.horario}
                            </p>
                          </div>
                        ))}
                        {dayData.events.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            + {dayData.events.length - 2} mais
                          </div>
                        )}
                      </div>
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
                          className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                        >
                          {date.events.map((event) => (
                            <span
                              key={event.id}
                              className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground"
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Day Events (Mobile) */}
      {!isDesktop && selectedDayEvents.length > 0 && (
        <div className="mt-4 space-y-2 px-4 pb-4">
          <h3 className="text-sm font-semibold">
            Agendamentos - {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
          </h3>
          {selectedDayEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent cursor-pointer"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{event.lead_nome}</p>
                  {event.synced_with_google && (
                    <Badge variant="outline" className="gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      Sync
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.horario} • {event.lead_telefone}
                </p>
                {event.observacoes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {event.observacoes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
