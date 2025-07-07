import { TrendingUp, MessageSquare, Calendar, DollarSign } from "lucide-react";

const metrics = [
  {
    title: "Revenue",
    value: "$45,231",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
    color: "success"
  },
  {
    title: "Conversations",
    value: "1,235",
    change: "+18%",
    trend: "up", 
    icon: MessageSquare,
    color: "primary"
  },
  {
    title: "Bookings",
    value: "452",
    change: "+12%",
    trend: "up",
    icon: Calendar,
    color: "warning"
  },
  {
    title: "MQLs",
    value: "231",
    change: "+9%",
    trend: "up",
    icon: TrendingUp,
    color: "chart-1"
  }
];

export function KPIGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className={`p-2 rounded-lg bg-${metric.color}/10`}>
                <metric.icon className={`w-4 h-4 text-${metric.color}`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${metric.color}/10 text-${metric.color}`}>
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