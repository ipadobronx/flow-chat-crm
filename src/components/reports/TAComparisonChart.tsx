import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TAComparisonChartProps {
  currentOIs: number;
  previousOIs: number;
  currentPeriod: string;
  previousPeriod: string;
}

export function TAComparisonChart({
  currentOIs,
  previousOIs,
  currentPeriod,
  previousPeriod,
}: TAComparisonChartProps) {
  const data = [
    {
      name: "Período Anterior",
      value: previousOIs,
      period: previousPeriod,
      fill: "hsl(var(--muted-foreground) / 0.4)",
    },
    {
      name: "Período Atual",
      value: currentOIs,
      period: currentPeriod,
      fill: "#6366f1", // Indigo - cor de OI
    },
  ];

  const percentageChange = previousOIs > 0
    ? ((currentOIs - previousOIs) / previousOIs) * 100
    : currentOIs > 0 ? 100 : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/20 bg-black/80 backdrop-blur-sm px-3 py-2 text-xs shadow-xl">
          <p className="font-medium text-white">{payload[0].payload.name}</p>
          <p className="text-white/60">{payload[0].payload.period}</p>
          <p className="text-lg font-bold text-white mt-1">
            {payload[0].value} OIs
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-inter font-normal tracking-tight text-white">
          Comparação de OIs Agendados
        </h3>
        <p className="text-xs text-white/60 mt-1">
          Período atual vs período anterior
        </p>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
            <XAxis type="number" stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="rgba(255,255,255,0.6)" 
              fontSize={11}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Variação</span>
          <div className={cn(
            "text-lg font-bold",
            percentageChange > 0 ? "text-green-400" : percentageChange < 0 ? "text-red-400" : "text-white/50"
          )}>
            {percentageChange > 0 ? "+" : ""}{percentageChange.toFixed(0)}%
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-white/60">
            {previousOIs} → {currentOIs} OIs
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            percentageChange > 0 
              ? "bg-green-500/20 text-green-400" 
              : percentageChange < 0 
                ? "bg-red-500/20 text-red-400" 
                : "bg-white/10 text-white/50"
          )}>
            {percentageChange > 0 ? "Melhorou" : percentageChange < 0 ? "Piorou" : "Estável"}
          </span>
        </div>
      </div>
    </div>
  );
}
