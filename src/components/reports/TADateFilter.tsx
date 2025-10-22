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
    <div className="flex items-center gap-4">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7dias">7 dias</SelectItem>
          <SelectItem value="30dias">30 dias</SelectItem>
          <SelectItem value="90dias">90 dias</SelectItem>
          <SelectItem value="customizado">Customizado</SelectItem>
        </SelectContent>
      </Select>

      {preset === "customizado" && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}