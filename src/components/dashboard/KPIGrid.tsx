import { useState, useEffect } from "react";
import { Phone, PhoneCall, Calendar, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  startDate?: Date;
  endDate?: Date;
}

export function KPIGrid({ startDate, endDate }: KPIGridProps) {
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
    }
  ]);

  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      let query = supabase
        .from('leads')
        .select('*');
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: leads, error } = await query;
      
      if (error) throw error;
      if (!leads) return;

      // Calcular métricas baseadas nos dados
      const ligacoesEfetuadas = leads.length;
      const foramAtendidas = leads.filter(lead => 
        lead.etapa !== 'Novo' && lead.etapa !== 'Ligar Depois' && lead.etapa !== 'Tentativa'
      ).length;
      const oiMarcados = leads.filter(lead => 
        lead.etapa === 'OI' || lead.etapa === 'Delay OI'
      ).length;
      const virouPC = leads.filter(lead => 
        lead.etapa === 'PC' || lead.etapa === 'Delay PC'
      ).length;
      const virouN = leads.filter(lead => 
        lead.etapa === 'N' || lead.etapa === 'Não'
      ).length;

      // Calcular percentuais (mudança fictícia para demonstração)
      const calcularMudanca = (atual: number, total: number) => {
        if (total === 0) return "0%";
        const percentual = ((atual / total) * 100).toFixed(1);
        return `${percentual}%`;
      };

      setMetrics([
        {
          title: "Ligações Efetuadas",
          value: ligacoesEfetuadas.toString(),
          change: "+100%",
          trend: "up" as const,
          icon: Phone,
          color: "primary" as const
        },
        {
          title: "Foram Atendidas",
          value: foramAtendidas.toString(),
          change: calcularMudanca(foramAtendidas, ligacoesEfetuadas),
          trend: "up" as const,
          icon: PhoneCall,
          color: "success" as const
        },
        {
          title: "OI Marcados",
          value: oiMarcados.toString(),
          change: calcularMudanca(oiMarcados, foramAtendidas),
          trend: "up" as const,
          icon: Calendar,
          color: "warning" as const
        },
        {
          title: "Virou PC",
          value: virouPC.toString(),
          change: calcularMudanca(virouPC, foramAtendidas),
          trend: "up" as const,
          icon: Target,
          color: "chart-1" as const
        },
        {
          title: "Virou N",
          value: virouN.toString(),
          change: calcularMudanca(virouN, foramAtendidas),
          trend: "up" as const,
          icon: TrendingUp,
          color: "chart-2" as const
        }
      ]);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.title}
          className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-card/80"
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
                metric.color === "chart-2" && "bg-chart-2/10"
              )}>
                <metric.icon className={cn(
                  "w-4 h-4",
                  metric.color === "primary" && "text-primary",
                  metric.color === "success" && "text-success",
                  metric.color === "warning" && "text-warning", 
                  metric.color === "chart-1" && "text-chart-1",
                  metric.color === "chart-2" && "text-chart-2"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                metric.color === "primary" && "bg-primary/10 text-primary",
                metric.color === "success" && "bg-success/10 text-success",
                metric.color === "warning" && "bg-warning/10 text-warning",
                metric.color === "chart-1" && "bg-chart-1/10 text-chart-1", 
                metric.color === "chart-2" && "bg-chart-2/10 text-chart-2"
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