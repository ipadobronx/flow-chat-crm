import { Bell, Search, User, LogOut, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import CheckedSwitch from "@/components/ui/checked-switch";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const [sitplanOnly, setSitplanOnly] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("showOnlySitplan");
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("showOnlySitplan", JSON.stringify(sitplanOnly));
    } catch {}
    const event = new CustomEvent("sitplan-filter-toggle", { detail: { value: sitplanOnly } });
    window.dispatchEvent(event);
  }, [sitplanOnly]);

  const meta = (
    {
      "/": { title: "Dashboard de Vendas", subtitle: "Insights em tempo real sobre seu desempenho" },
      "/dashboard/pipeline": { title: "Pipeline", subtitle: "Kanban de gestão de leads" },
      "/dashboard/nova-rec": { title: "Nova Recomendação", subtitle: "Cadastre um novo lead no sistema" },
      "/dashboard/import": { title: "Importar Leads", subtitle: "Upload e mapeamento de campos" },
      "/dashboard/schedule": { title: "Agendamentos", subtitle: "Gerencie e sincronize com Google Calendar" },
      "/dashboard/reports": { title: "Relatórios", subtitle: "Métricas e histórico dos seus TAs" },
      "/dashboard/settings": { title: "Configurações", subtitle: "Preferências e ajustes do sistema" },
      "/dashboard/security": { title: "Segurança", subtitle: "Monitoramento e políticas de acesso" },
      "/dashboard/sitplan": { title: "SitPlan", subtitle: "Planejamento e acompanhamento de leads" },
      "/dashboard/chat": { title: "Live Chat", subtitle: "Converse em tempo real com seus leads" },
      "/dashboard/atrasos": { title: "Atrasos", subtitle: "Leads com pendências e follow-up" },
      "/dashboard/bulk": { title: "Envio em Massa", subtitle: "Dispare mensagens para vários leads" },
      "/dashboard/ta": { title: "TA Categorias", subtitle: "Gestão de categorias de TA" },
      "/dashboard/ta-presentation": { title: "Apresentação TA", subtitle: "Visão geral de TA" },
    } as Record<string, { title: string; subtitle: string }>
  )[pathname] ?? { title: "Dashboard de Vendas", subtitle: "Bem-vindo" };
  
  return (
    <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-1.5">
      <div className="sticky top-0 z-50 flex items-center justify-between rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 px-3 sm:px-3 py-2">
          <SidebarTrigger className="flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold truncate tracking-tight">{meta.title}</h2>
            <p className="text-xs text-muted-foreground truncate">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-2 lg:space-x-3 flex-shrink-0 px-3 sm:px-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* SitPlan Filter */}
        <div className="hidden sm:flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <CheckedSwitch
            checked={sitplanOnly}
            onChange={(v) => setSitplanOnly(v)}
          />
        </div>

        {/* Search - Hidden on mobile */}
        <Button variant="ghost" size="icon" className="relative hidden sm:flex">
          <Search className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-1">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </div>
  );
}