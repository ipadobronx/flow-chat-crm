import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateFilterProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function DateFilter({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: DateFilterProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filtrar por período:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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

        {/* Botão Voltar ao Hoje */}
        <Button
          variant="ghost"
          onClick={() => {
            const today = new Date();
            onStartDateChange(today);
            onEndDateChange(today);
          }}
          className="px-3"
        >
          Hoje
        </Button>
      </div>
    </div>
  );
}