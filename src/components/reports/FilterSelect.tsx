import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterSelectProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecionar",
  className,
}: FilterSelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs text-white/60 font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className="h-9 bg-white/5 border-white/20 text-white hover:bg-white/10 focus:ring-white/20 rounded-xl"
        >
          <div className="flex items-center gap-2">
            {value && value !== "all" && options.find(o => o.value === value)?.color && (
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: options.find(o => o.value === value)?.color }}
              />
            )}
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a1a]/95 backdrop-blur-xl border-white/20 rounded-xl">
          <SelectItem 
            value="all" 
            className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg"
          >
            Todos
          </SelectItem>
          {options
            .filter(option => option.value && option.value.trim() !== '')
            .map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {option.color && (
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
