import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardGlassProps {
  title: string;
  value: number;
  percentageChange?: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  subtitle?: string;
}

export function KPICardGlass({ 
  title, 
  value, 
  percentageChange = 0, 
  icon: Icon, 
  iconColor, 
  iconBgColor,
  subtitle = "taxa de conversão"
}: KPICardGlassProps) {
  const isPositive = percentageChange > 0;
  const isNegative = percentageChange < 0;
  const isNeutral = percentageChange === 0;

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-5 
      transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5 hover:border-white/30">
      
      {/* Header com ícone e badge de porcentagem */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", iconBgColor)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
          isPositive && "bg-[#d4ff4a]/20 text-[#d4ff4a]",
          isNegative && "bg-red-500/20 text-red-400",
          isNeutral && "bg-white/10 text-white/60"
        )}>
          {isPositive && <TrendingUp className="w-3 h-3" />}
          {isNegative && <TrendingDown className="w-3 h-3" />}
          {isNeutral && <Minus className="w-3 h-3" />}
          <span>{isPositive ? "+" : ""}{percentageChange.toFixed(0)}%</span>
        </div>
      </div>
      
      {/* Valor e título */}
      <div className="space-y-1">
        <p className="text-3xl font-inter font-normal tracking-tighter text-white">
          {value.toLocaleString('pt-BR')}
        </p>
        <p className="text-sm text-white/80 font-medium">{title}</p>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>
    </div>
  );
}
