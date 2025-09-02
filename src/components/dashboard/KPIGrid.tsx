import { useState, useEffect } from "react";
import { Users, Phone, Calendar, FileText, CheckCircle, Award } from "lucide-react";
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
      title: "Nº de rec",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: Users,
      color: "primary" as const
    },
    {
      title: "Ligações",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: Phone,
      color: "success" as const
    },
    {
      title: "OIs Agendados",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: Calendar,
      color: "warning" as const
    },
    {
      title: "Proposta apresentada",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: FileText,
      color: "chart-1" as const
    },
    {
      title: "N Realizado",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: CheckCircle,
      color: "chart-2" as const
    },
    {
      title: "Apólice Emitida",
      value: "0",
      change: "0%",
      trend: "up" as const,
      icon: Award,
      color: "chart-3" as const
    }
  ]);

  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      // Buscar métricas do funil de vendas
      const { data: salesFunnelData, error } = await supabase
        .from('leads')
        .select('etapa, created_at')
        .gte('created_at', startDate?.toISOString() || new Date().toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString());

      if (error) throw error;

      // Contar métricas por etapa do funil
      const totalRecs = salesFunnelData?.length || 0;
      const ligacoes = salesFunnelData?.filter(lead => 
        ['Ligar Depois', 'OI', 'PC', 'N', 'Apólice Emitida'].includes(lead.etapa)
      ).length || 0;
      const oisAgendados = salesFunnelData?.filter(lead => 
        ['OI', 'PC', 'N', 'Apólice Emitida'].includes(lead.etapa)
      ).length || 0;
      const propostasApresentadas = salesFunnelData?.filter(lead => 
        ['PC', 'N', 'Apólice Emitida'].includes(lead.etapa)
      ).length || 0;
      const negociosRealizados = salesFunnelData?.filter(lead => 
        ['N', 'Apólice Emitida'].includes(lead.etapa)
      ).length || 0;
      const apolicesEmitidas = salesFunnelData?.filter(lead => 
        lead.etapa === 'Apólice Emitida'
      ).length || 0;

      // Calcular taxas de conversão
      const calcularTaxaConversao = (atual: number, anterior: number) => {
        if (anterior === 0) return "0%";
        const taxa = ((atual / anterior) * 100).toFixed(1);
        return `${taxa}%`;
      };

      setMetrics([
        {
          title: "Nº de rec",
          value: totalRecs.toString(),
          change: "+100%",
          trend: "up" as const,
          icon: Users,
          color: "primary" as const
        },
        {
          title: "Ligações",
          value: ligacoes.toString(),
          change: calcularTaxaConversao(ligacoes, totalRecs),
          trend: "up" as const,
          icon: Phone,
          color: "success" as const
        },
        {
          title: "OIs Agendados",
          value: oisAgendados.toString(),
          change: calcularTaxaConversao(oisAgendados, ligacoes),
          trend: "up" as const,
          icon: Calendar,
          color: "warning" as const
        },
        {
          title: "Proposta apresentada",
          value: propostasApresentadas.toString(),
          change: calcularTaxaConversao(propostasApresentadas, oisAgendados),
          trend: "up" as const,
          icon: FileText,
          color: "chart-1" as const
        },
        {
          title: "N Realizado",
          value: negociosRealizados.toString(),
          change: calcularTaxaConversao(negociosRealizados, propostasApresentadas),
          trend: "up" as const,
          icon: CheckCircle,
          color: "chart-2" as const
        },
        {
          title: "Apólice Emitida",
          value: apolicesEmitidas.toString(),
          change: calcularTaxaConversao(apolicesEmitidas, negociosRealizados),
          trend: "up" as const,
          icon: Award,
          color: "chart-3" as const
        }
      ]);
    } catch (error) {
      console.error('Erro ao buscar métricas do funil de vendas:', error);
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