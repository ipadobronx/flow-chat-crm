import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LiquidGlassCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  datesWithEvents?: Date[];
  className?: string;
}

export const LiquidGlassCalendar = ({
  selected,
  onSelect,
  datesWithEvents = [],
  className,
}: LiquidGlassCalendarProps) => {
  // Check if a date has events
  const hasEvent = (date: Date) => {
    return datesWithEvents.some(
      (eventDate) =>
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
    );
  };

  return (
    <div
      className={cn(
        "bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-4",
        className
      )}
    >
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        className="w-full pointer-events-auto"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4 w-full",
          caption: "flex justify-center pt-1 relative items-center mb-4",
          caption_label: "text-base font-medium text-white",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full p-0 flex items-center justify-center transition-all duration-200 border border-white/10"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex justify-between w-full mb-2",
          head_cell: "text-white/50 rounded-md w-10 font-normal text-[0.75rem] uppercase tracking-wide",
          row: "flex w-full mt-1 justify-between",
          cell: cn(
            "relative h-10 w-10 text-center text-sm p-0",
            "focus-within:relative focus-within:z-20"
          ),
          day: cn(
            "h-10 w-10 p-0 font-normal rounded-full flex items-center justify-center transition-all duration-200",
            "text-white/80 hover:bg-white/10 hover:text-white",
            "aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected: cn(
            "bg-[#d4ff4a] text-black hover:bg-[#c9f035] hover:text-black",
            "focus:bg-[#d4ff4a] focus:text-black font-semibold"
          ),
          day_today: "bg-white/10 text-white font-semibold border border-white/20",
          day_outside: "text-white/20 opacity-50",
          day_disabled: "text-white/20 opacity-30",
          day_range_middle: "aria-selected:bg-white/10 aria-selected:text-white",
          day_hidden: "invisible",
        }}
        components={{
          Chevron: ({ orientation }) => {
            const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
            return <Icon className="h-4 w-4 text-white" />;
          },
          DayButton: ({ day, modifiers, ...props }) => {
            const dateHasEvent = hasEvent(day.date);
            return (
              <button {...props}>
                <span className="relative flex items-center justify-center w-full h-full">
                  {day.date.getDate()}
                  {dateHasEvent && !modifiers.selected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#d4ff4a]" />
                  )}
                </span>
              </button>
            );
          },
        }}
      />
    </div>
  );
};
