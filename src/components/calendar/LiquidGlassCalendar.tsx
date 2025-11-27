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
        "bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-3 sm:p-4 md:p-5",
        className
      )}
    >
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        className="w-full pointer-events-auto"
        classNames={{
          // Main structure - v9 API
          months: "flex flex-col w-full",
          month: "space-y-3 sm:space-y-4 w-full",
          month_caption: "flex justify-center pt-1 relative items-center mb-3 sm:mb-4",
          caption_label: "text-sm sm:text-base font-medium text-white",
          
          // Navigation - v9 API
          nav: "space-x-1 flex items-center",
          button_previous: cn(
            "absolute left-0 sm:left-1 h-7 w-7 sm:h-8 sm:w-8",
            "bg-white/10 hover:bg-white/20 rounded-full p-0",
            "flex items-center justify-center transition-all duration-200 border border-white/10"
          ),
          button_next: cn(
            "absolute right-0 sm:right-1 h-7 w-7 sm:h-8 sm:w-8",
            "bg-white/10 hover:bg-white/20 rounded-full p-0",
            "flex items-center justify-center transition-all duration-200 border border-white/10"
          ),
          
          // Calendar grid - v9 API (previously table, head_row, row, cell)
          month_grid: "w-full border-collapse",
          weekdays: "flex justify-between w-full mb-1 sm:mb-2",
          weekday: "text-white/50 flex-1 font-normal text-[0.65rem] sm:text-[0.75rem] uppercase tracking-wide text-center",
          week: "flex w-full mt-0.5 sm:mt-1 justify-between",
          day: cn(
            "relative text-center text-xs sm:text-sm p-0 flex-1 aspect-square",
            "focus-within:relative focus-within:z-20"
          ),
          day_button: cn(
            "h-full w-full p-0 font-normal rounded-full flex items-center justify-center transition-all duration-200",
            "text-white/80 hover:bg-white/10 hover:text-white text-xs sm:text-sm",
            "aria-selected:opacity-100"
          ),
          
          // Day states - v9 API
          range_end: "day-range-end",
          selected: cn(
            "bg-[#d4ff4a] text-black hover:bg-[#c9f035] hover:text-black",
            "focus:bg-[#d4ff4a] focus:text-black font-semibold"
          ),
          today: "bg-white/10 text-white font-semibold border border-white/20",
          outside: "text-white/20 opacity-50",
          disabled: "text-white/20 opacity-30",
          range_middle: "aria-selected:bg-white/10 aria-selected:text-white",
          hidden: "invisible",
        }}
        components={{
          Chevron: ({ orientation }) => {
            const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
            return <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
          },
          DayButton: ({ day, modifiers, ...props }) => {
            const dateHasEvent = hasEvent(day.date);
            return (
              <button {...props} className={cn(props.className, "relative")}>
                <span className="relative flex items-center justify-center w-full h-full">
                  {day.date.getDate()}
                  {dateHasEvent && !modifiers.selected && (
                    <span className="absolute bottom-0 sm:bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#d4ff4a]" />
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
