import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";

interface TADateFilterProps {
  startDate: Date;
  endDate: Date;
  preset: string;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onPresetChange: (preset: string) => void;
}

// Liquid glass calendar classNames (react-day-picker v9 API) - Popover size
const liquidGlassCalendarClassNames = {
  months: "flex flex-col w-full",
  month: "space-y-4 w-full",
  month_caption: "flex justify-center pt-1 relative items-center mb-4",
  caption_label: "text-sm font-medium text-white",
  nav: "space-x-1 flex items-center",
  button_previous: "absolute left-1 h-7 w-7 bg-white/10 hover:bg-white/20 rounded-full p-0 flex items-center justify-center transition-colors border border-white/10",
  button_next: "absolute right-1 h-7 w-7 bg-white/10 hover:bg-white/20 rounded-full p-0 flex items-center justify-center transition-colors border border-white/10",
  month_grid: "w-full border-collapse",
  weekdays: "flex justify-between w-full mb-2",
  weekday: "text-white/50 flex-1 font-normal text-[0.75rem] uppercase tracking-wide text-center",
  week: "flex w-full mt-1 justify-between",
  day: "relative text-center text-sm p-0 flex-1 aspect-square focus-within:relative focus-within:z-20",
  day_button: "h-full w-full p-0 font-normal rounded-full flex items-center justify-center transition-colors text-white/80 hover:bg-white/10 hover:text-white",
  range_end: "day-range-end",
  selected: "bg-[#d4ff4a] text-black hover:bg-[#c9f035] hover:text-black focus:bg-[#d4ff4a] focus:text-black font-semibold",
  today: "bg-white/10 text-white font-semibold border border-white/20",
  outside: "text-white/20 opacity-50",
  disabled: "text-white/20 opacity-30",
  range_middle: "aria-selected:bg-white/10 aria-selected:text-white",
  hidden: "invisible",
};

// Larger calendar for Drawer (mobile/tablet) - compact height, expanded width
const liquidGlassCalendarLargeClassNames = {
  months: "flex flex-col w-full",
  month: "space-y-4 w-full",
  month_caption: "flex justify-center pt-1 relative items-center mb-4",
  caption_label: "text-lg font-medium text-white",
  nav: "space-x-1 flex items-center",
  button_previous: "absolute left-0 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full p-0 flex items-center justify-center transition-colors border border-white/10",
  button_next: "absolute right-0 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full p-0 flex items-center justify-center transition-colors border border-white/10",
  month_grid: "w-full border-collapse",
  weekdays: "flex justify-between w-full mb-2",
  weekday: "text-white/50 flex-1 font-normal text-sm uppercase tracking-wide text-center",
  week: "flex w-full mt-1 justify-between",
  day: "relative text-center text-lg p-0 flex-1 aspect-square focus-within:relative focus-within:z-20",
  day_button: "h-12 w-12 p-0 font-normal rounded-full flex items-center justify-center transition-colors text-white/80 hover:bg-white/10 hover:text-white mx-auto text-base",
  range_end: "day-range-end",
  selected: "bg-[#d4ff4a] text-black hover:bg-[#c9f035] hover:text-black focus:bg-[#d4ff4a] focus:text-black font-semibold",
  today: "bg-white/10 text-white font-semibold border border-white/20",
  outside: "text-white/20 opacity-50",
  disabled: "text-white/20 opacity-30",
  range_middle: "aria-selected:bg-white/10 aria-selected:text-white",
  hidden: "invisible",
};

export function TADateFilter({
  startDate,
  endDate,
  preset,
  onStartDateChange,
  onEndDateChange,
  onPresetChange,
}: TADateFilterProps) {
  const isMobile = useIsMobile();
  const { isTablet, isTouchDevice } = useIsTablet();
  const useDrawer = isMobile || isTablet || isTouchDevice;
  const [startDrawerOpen, setStartDrawerOpen] = useState(false);
  const [endDrawerOpen, setEndDrawerOpen] = useState(false);

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

  const StartDateButton = (
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
  );

  const EndDateButton = (
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
  );

  const renderStartDatePicker = () => {
    if (useDrawer) {
      return (
        <Drawer open={startDrawerOpen} onOpenChange={setStartDrawerOpen}>
          <DrawerTrigger asChild>{StartDateButton}</DrawerTrigger>
          <DrawerContent className="rounded-t-3xl border border-white/20 bg-black/95 backdrop-blur-xl max-h-[70vh]">
            <DrawerHeader className="text-center py-3">
              <DrawerTitle className="text-white font-inter font-normal">
                Selecionar Data Inicial
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 flex justify-center w-full">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  onStartDateChange(date);
                  setStartDrawerOpen(false);
                }}
                locale={ptBR}
                className="p-2 pointer-events-auto w-full"
                classNames={liquidGlassCalendarLargeClassNames}
              />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>{StartDateButton}</PopoverTrigger>
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
    );
  };

  const renderEndDatePicker = () => {
    if (useDrawer) {
      return (
        <Drawer open={endDrawerOpen} onOpenChange={setEndDrawerOpen}>
          <DrawerTrigger asChild>{EndDateButton}</DrawerTrigger>
          <DrawerContent className="rounded-t-3xl border border-white/20 bg-black/95 backdrop-blur-xl max-h-[70vh]">
            <DrawerHeader className="text-center py-3">
              <DrawerTitle className="text-white font-inter font-normal">
                Selecionar Data Final
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 flex justify-center w-full">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  onEndDateChange(date);
                  setEndDrawerOpen(false);
                }}
                locale={ptBR}
                className="p-2 pointer-events-auto w-full"
                classNames={liquidGlassCalendarLargeClassNames}
              />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>{EndDateButton}</PopoverTrigger>
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
    );
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
          {renderStartDatePicker()}
          <span className="text-white/50 text-sm">até</span>
          {renderEndDatePicker()}
        </div>
      )}
    </div>
  );
}
