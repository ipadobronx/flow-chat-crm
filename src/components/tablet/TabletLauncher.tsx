import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card";
import { LiquidGlassIconButton } from "@/components/ui/liquid-glass-icon-button";
import { 
  Target, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  CheckSquare, 
  BarChart3,
  Plus,
  Settings
} from "lucide-react";

const menuItems = [
  { 
    icon: Target, 
    title: "Pipeline", 
    description: "Funil de vendas",
    to: "/dashboard/pipeline" 
  },
  { 
    icon: Calendar, 
    title: "Agendamentos", 
    description: "Compromissos",
    to: "/dashboard/schedule" 
  },
  { 
    icon: AlertTriangle, 
    title: "Atrasos", 
    description: "Pagamentos",
    to: "/dashboard/atrasos" 
  },
  { 
    icon: FileText, 
    title: "Sit Plan", 
    description: "Planejamento",
    to: "/dashboard/sitplan" 
  },
  { 
    icon: CheckSquare, 
    title: "TA", 
    description: "Telefonemas",
    to: "/dashboard/ta" 
  },
  { 
    icon: BarChart3, 
    title: "Relatório TA", 
    description: "Métricas",
    to: "/dashboard/reports" 
  },
];

export function TabletLauncher() {
  return (
    <AuroraBackground className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-8">
        <div className="animate-fade-in">
          <h1 className="font-inter text-3xl font-light tracking-tighter text-white">
            CRM Nichado
          </h1>
          <p className="mt-1 text-base text-white/50">
            Bem-vindo ao seu Dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <LiquidGlassIconButton 
            icon={Plus} 
            to="/dashboard/nova-rec" 
            label="Nova Recomendação"
          />
          <LiquidGlassIconButton 
            icon={Settings} 
            to="/dashboard/settings" 
            label="Configurações"
          />
        </div>
      </header>

      {/* Main Grid - 2 rows x 3 columns */}
      <main className="flex flex-1 items-center justify-center px-6 pb-8">
        <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
          {menuItems.map((item, index) => (
            <LiquidGlassCard
              key={item.to}
              icon={item.icon}
              title={item.title}
              description={item.description}
              to={item.to}
              delay={index * 80}
            />
          ))}
        </div>
      </main>

      {/* Footer subtle branding */}
      <footer className="px-6 pb-6 text-center">
        <p className="text-xs text-white/20">
          Powered by Lovable
        </p>
      </footer>
    </AuroraBackground>
  );
}
