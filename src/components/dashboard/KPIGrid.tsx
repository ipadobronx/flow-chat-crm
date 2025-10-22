import { Users, Phone, Calendar, FileText, CheckCircle, Award } from "lucide-react";
import { useKPIMetrics } from "@/hooks/dashboard/useKPIMetrics";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  startDate?: Date;
  endDate?: Date;
}

export function KPIGrid({ startDate, endDate }: KPIGridProps) {
  const { data: kpiData, isLoading } = useKPIMetrics(startDate, endDate);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum dado disponível para o período selecionado
      </div>
    );
  }

  const metrics = [
    {
      title: "Nº de rec",
      value: kpiData.total_rec.toString(),
      change: "+100%",
      trend: "up" as const,
      icon: Users,
      color: "primary" as const
    },
    {
      title: "Ligações",
      value: kpiData.total_ligacoes.toString(),
      change: `${kpiData.taxa_conversao_ligacao}%`,
      trend: kpiData.taxa_conversao_ligacao >= 50 ? "up" as const : "down" as const,
      icon: Phone,
      color: "success" as const
    },
    {
      title: "OIs Agendados",
      value: kpiData.total_oi_agendados.toString(),
      change: `${kpiData.taxa_conversao_oi}%`,
      trend: kpiData.taxa_conversao_oi >= 30 ? "up" as const : "down" as const,
      icon: Calendar,
      color: "warning" as const
    },
    {
      title: "Proposta apresentada",
      value: kpiData.total_proposta_apresentada.toString(),
      change: `${kpiData.taxa_conversao_proposta}%`,
      trend: kpiData.taxa_conversao_proposta >= 50 ? "up" as const : "down" as const,
      icon: FileText,
      color: "chart-1" as const
    },
    {
      title: "N Realizado",
      value: kpiData.total_n_realizado.toString(),
      change: `${kpiData.taxa_conversao_n}%`,
      trend: kpiData.taxa_conversao_n >= 60 ? "up" as const : "down" as const,
      icon: CheckCircle,
      color: "chart-2" as const
    },
    {
      title: "Apólice Emitida",
      value: kpiData.total_apolice_emitida.toString(),
      change: `${kpiData.taxa_conversao_apolice}%`,
      trend: kpiData.taxa_conversao_apolice >= 70 ? "up" as const : "down" as const,
      icon: Award,
      color: "chart-3" as const
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.title}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-3 sm:p-4 lg:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-card/80"
        >
          {/* Background Gradient Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Content */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "p-2 rounded-lg",
                metric.color === "primary" && "bg-primary/10",
                metric.color === "success" && "bg-success/10", 
                metric.color === "warning" && "bg-warning/10",
                metric.color === "chart-1" && "bg-chart-1/10",
                metric.color === "chart-2" && "bg-chart-2/10",
                metric.color === "chart-3" && "bg-chart-3/10"
              )}>
                <metric.icon className={cn(
                  "w-4 h-4",
                  metric.color === "primary" && "text-primary",
                  metric.color === "success" && "text-success",
                  metric.color === "warning" && "text-warning", 
                  metric.color === "chart-1" && "text-chart-1",
                  metric.color === "chart-2" && "text-chart-2",
                  metric.color === "chart-3" && "text-chart-3"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                metric.color === "primary" && "bg-primary/10 text-primary",
                metric.color === "success" && "bg-success/10 text-success",
                metric.color === "warning" && "bg-warning/10 text-warning",
                metric.color === "chart-1" && "bg-chart-1/10 text-chart-1", 
                metric.color === "chart-2" && "bg-chart-2/10 text-chart-2",
                metric.color === "chart-3" && "bg-chart-3/10 text-chart-3"
              )}>
                {metric.change}
              </span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight">{metric.value}</h3>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="text-xs text-muted-foreground">taxa de conversão</p>
            </div>
          </div>

          {/* Shimmer Effect */}
          <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
