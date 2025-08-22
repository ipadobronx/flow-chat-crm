import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, subDays, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateFilterProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

type FilterPeriod = 'hoje' | 'semana' | 'mes' | 'customizado';

const periodOptions = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Esta Semana' },
  { value: 'mes', label: 'Este Mês' },
  { value: 'customizado', label: 'Período Customizado' },
];

export function DateFilter({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: DateFilterProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('hoje');

  const handlePeriodChange = (period: FilterPeriod) => {
    setSelectedPeriod(period);
    const today = new Date();
    
    switch (period) {
      case 'hoje':
        onStartDateChange(today);
        onEndDateChange(today);
        break;
      case 'semana':
        const weekStart = startOfWeek(today, { locale: ptBR });
        const weekEnd = endOfWeek(today, { locale: ptBR });
        onStartDateChange(weekStart);
        onEndDateChange(weekEnd);
        break;
      case 'mes':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        onStartDateChange(monthStart);
        onEndDateChange(monthEnd);
        break;
      case 'customizado':
        // Não altera as datas, permite seleção manual
        break;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filtrar por período:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {/* Seletor de Período */}
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Datas Customizadas - Mostrar apenas quando período customizado estiver selecionado */}
        {selectedPeriod === 'customizado' && (
          <>
            {/* Data Início */}
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] md:w-[240px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Data início"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    onStartDateChange(date);
                    setStartOpen(false);
                  }}
                  disabled={(date) =>
                    date > new Date() || (endDate && date > endDate)
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Data Fim */}
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] md:w-[240px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Data fim"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    onEndDateChange(date);
                    setEndOpen(false);
                  }}
                  disabled={(date) =>
                    date > new Date() || (startDate && date < startDate)
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Mostrar período selecionado quando não for customizado */}
        {selectedPeriod !== 'customizado' && startDate && endDate && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {startDate.toDateString() === endDate.toDateString() 
                ? format(startDate, "PPP", { locale: ptBR })
                : `${format(startDate, "dd/MM", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}