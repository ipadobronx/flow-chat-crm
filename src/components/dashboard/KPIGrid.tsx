import { useState, useEffect } from "react";
import { Phone, PhoneCall, Calendar, Target, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  startDate?: Date;
  endDate?: Date;
}

export function KPIGrid({ startDate, endDate }: KPIGridProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([
    {
      title: "Ligações Efetuadas",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: Phone,
      color: "primary" as const
    },
    {
      title: "Foram Atendidas",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: PhoneCall,
      color: "success" as const
    },
    {
      title: "OI Marcados",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: Calendar,
      color: "warning" as const
    },
    {
      title: "Virou PC",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: Target,
      color: "chart-1" as const
    },
    {
      title: "Virou N",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: TrendingUp,
      color: "chart-2" as const
    },
    {
      title: "Recomendações Feitas",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: Users,
      color: "chart-3" as const
    }
  ]);

  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      // Usar função otimizada do banco para buscar métricas
      const { data: metrics, error } = await supabase
        .rpc('get_leads_with_metrics', {
          p_user_id: user?.id,
          p_start_date: startDate?.toISOString(),
          p_end_date: endDate?.toISOString()
        });

      if (error) throw error;
      
      const metricsData = metrics?.[0] || {
        total_leads: 0,
        leads_atendidos: 0,
        oi_marcados: 0,
        virou_pc: 0,
        virou_n: 0,
        recomendacoes: 0
      };

      // Calcular percentuais (mudança fictícia para demonstração)
      const calcularMudanca = (atual: number, total: number) => {
        if (total === 0) return "0%";
        const percentual = ((atual / total) * 100).toFixed(1);
        return `${percentual}%`;
      };

      setMetrics([
        {
          title: "Ligações Efetuadas",
          value: metricsData.total_leads.toString(),
          change: "+100%",
          trend: "up" as const,
          icon: Phone,
          color: "primary" as const
        },
        {
          title: "Foram Atendidas",
          value: metricsData.leads_atendidos.toString(),
          change: calcularMudanca(Number(metricsData.leads_atendidos), Number(metricsData.total_leads)),
          trend: "up" as const,
          icon: PhoneCall,
          color: "success" as const
        },
        {
          title: "OI Marcados",
          value: metricsData.oi_marcados.toString(),
          change: calcularMudanca(Number(metricsData.oi_marcados), Number(metricsData.leads_atendidos)),
          trend: "up" as const,
          icon: Calendar,
          color: "warning" as const
        },
        {
          title: "Virou PC",
          value: metricsData.virou_pc.toString(),
          change: calcularMudanca(Number(metricsData.virou_pc), Number(metricsData.leads_atendidos)),
          trend: "up" as const,
          icon: Target,
          color: "chart-1" as const
        },
        {
          title: "Virou N",
          value: metricsData.virou_n.toString(),
          change: calcularMudanca(Number(metricsData.virou_n), Number(metricsData.leads_atendidos)),
          trend: "up" as const,
          icon: TrendingUp,
          color: "chart-2" as const
        },
        {
          title: "Recomendações Feitas",
          value: metricsData.recomendacoes.toString(),
          change: calcularMudanca(Number(metricsData.recomendacoes), Number(metricsData.total_leads)),
          trend: "up" as const,
          icon: Users,
          color: "chart-3" as const
        }
      ]);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };
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
              <p className="text-xs text-muted-foreground">vs. last month</p>
            </div>
          </div>

          {/* Shimmer Effect */}
          <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-shimmer" />
        </div>
      ))}
    </div>
  );
}