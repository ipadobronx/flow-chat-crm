import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TADateFilterProps {
  startDate: Date;
  endDate: Date;
  preset: string;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onPresetChange: (preset: string) => void;
}

// Liquid glass calendar classNames
const liquidGlassCalendarClassNames = {
  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
  month: "space-y-4",
  caption: "flex justify-center pt-1 relative items-center text-white",
  caption_label: "text-sm font-medium text-white",
  nav: "space-x-1 flex items-center",
  nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center",
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse space-y-1",
  head_row: "flex",
  head_cell: "text-white/50 rounded-md w-9 font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
  day: "h-9 w-9 p-0 font-normal text-white hover:bg-white/10 rounded-lg transition-colors inline-flex items-center justify-center",
  day_range_end: "day-range-end",
  day_selected: "bg-[#d4ff4a] text-black hover:bg-[#d4ff4a] hover:text-black focus:bg-[#d4ff4a] focus:text-black rounded-lg",
  day_today: "border border-white/40 text-white rounded-lg",
  day_outside: "text-white/30 opacity-50",
  day_disabled: "text-white/20 opacity-50",
  day_range_middle: "aria-selected:bg-white/10 aria-selected:text-white",
  day_hidden: "invisible",
};

export function TADateFilter({
  startDate,
  endDate,
  preset,
  onStartDateChange,
  onEndDateChange,
  onPresetChange,
}: TADateFilterProps) {

  const handlePresetChange = (value: string) => {
    console.log("TADateFilter - Preset changed to:", value);
    onPresetChange(value);
    
    const today = new Date();
    
    if (value === "7dias") {
      console.log("TADateFilter - Setting 7 days period");
      const sevenDaysAgo = subDays(today, 6);
      onStartDateChange(sevenDaysAgo);
      onEndDateChange(today);
    } else if (value === "30dias") {
      console.log("TADateFilter - Setting 30 days period");
      const thirtyDaysAgo = subDays(today, 29);
      onStartDateChange(thirtyDaysAgo);
      onEndDateChange(today);
    } else if (value === "90dias") {
      console.log("TADateFilter - Setting 90 days period");
      const ninetyDaysAgo = subDays(today, 89);
      onStartDateChange(ninetyDaysAgo);
      onEndDateChange(today);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Select com Liquid Glass */}
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px] rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/15 transition-all duration-300 focus:ring-1 focus:ring-white/30">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent className="z-50 rounded-xl border border-white/20 bg-black/80 backdrop-blur-xl shadow-2xl">
          <SelectItem 
            value="7dias" 
            className="rounded-lg text-white/90 focus:bg-white/10 focus:text-white cursor-pointer"
          >
            7 dias
          </SelectItem>
          <SelectItem 
            value="30dias" 
            className="rounded-lg text-white/90 focus:bg-white/10 focus:text-white cursor-pointer"
          >
            30 dias
          </SelectItem>
          <SelectItem 
            value="90dias" 
            className="rounded-lg text-white/90 focus:bg-white/10 focus:text-white cursor-pointer"
          >
            90 dias
          </SelectItem>
          <SelectItem 
            value="customizado" 
            className="rounded-lg text-white/90 focus:bg-white/10 focus:text-white cursor-pointer"
          >
            Customizado
          </SelectItem>
        </SelectContent>
      </Select>

      {preset === "customizado" && (
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[130px] sm:w-[140px] justify-start text-left font-normal rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/15 transition-all duration-300",
                  !startDate && "text-white/50"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 z-50 rounded-2xl border border-white/20 bg-black/90 backdrop-blur-xl shadow-2xl" 
              align="start"
            >
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                locale={ptBR}
                initialFocus
                className="p-3 pointer-events-auto"
                classNames={liquidGlassCalendarClassNames}
              />
            </PopoverContent>
          </Popover>

          <span className="text-white/50 text-sm">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[130px] sm:w-[140px] justify-start text-left font-normal rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/15 transition-all duration-300",
                  !endDate && "text-white/50"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 z-50 rounded-2xl border border-white/20 bg-black/90 backdrop-blur-xl shadow-2xl" 
              align="start"
            >
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                locale={ptBR}
                initialFocus
                className="p-3 pointer-events-auto"
                classNames={liquidGlassCalendarClassNames}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
