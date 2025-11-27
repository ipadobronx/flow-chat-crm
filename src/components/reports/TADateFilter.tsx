import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays } from "date-fns";
import { CalendarDrawer } from "@/components/ui/calendar-drawer";

interface TADateFilterProps {
  startDate: Date;
  endDate: Date;
  preset: string;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onPresetChange: (preset: string) => void;
}

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
          <CalendarDrawer
            date={startDate}
            onDateChange={onStartDateChange}
            title="Selecionar Data Inicial"
            placeholder="Início"
          />
          <span className="text-white/50 text-sm">até</span>
          <CalendarDrawer
            date={endDate}
            onDateChange={onEndDateChange}
            title="Selecionar Data Final"
            placeholder="Fim"
          />
        </div>
      )}
    </div>
  );
}
