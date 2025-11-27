import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TAMetricCardGlassProps {
  title: string;
  value: number;
  previousValue?: number;
  stageColor: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function TAMetricCardGlass({
  title,
  value,
  previousValue,
  stageColor,
  isActive = false,
  onClick,
}: TAMetricCardGlassProps) {
  const percentageChange = previousValue && previousValue > 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  const isPositive = percentageChange > 0;
  const isNeutral = percentageChange === 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/5 cursor-pointer p-5",
        isActive && "ring-2 ring-primary/50 scale-105 shadow-2xl"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-inter font-normal text-muted-foreground truncate pr-2">
          {title}
        </span>
        <div className={cn("w-3 h-3 rounded-full shrink-0", stageColor)} />
      </div>

      {/* Value */}
      <div className="space-y-2">
        <p className="text-3xl font-inter font-normal tracking-tighter text-foreground">
          {value.toLocaleString('pt-BR')}
        </p>

        {/* Comparison */}
        {previousValue !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            {isNeutral ? (
              <>
                <Minus className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">0%</span>
              </>
            ) : isPositive ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+{percentageChange.toFixed(0)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">{percentageChange.toFixed(0)}%</span>
              </>
            )}
            <span className="text-muted-foreground/70 text-[10px]">vs anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}
