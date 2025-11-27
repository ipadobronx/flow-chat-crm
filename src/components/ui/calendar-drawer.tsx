"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarDrawerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  title?: string;
  placeholder?: string;
}

export function CalendarDrawer({ 
  date, 
  onDateChange, 
  title = "Escolher data",
  placeholder = "Selecionar data"
}: CalendarDrawerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline"
          className={cn(
            "w-[140px] justify-start text-left font-normal rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/15 transition-all duration-300",
            !date && "text-white/50"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
          {date ? format(date, "dd/MM/yyyy") : placeholder}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>

        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onDateChange(newDate);
              setOpen(false);
            }}
            locale={ptBR}
            className="rounded-md border shadow pointer-events-auto"
          />
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
