import { Calendar, MessageSquare, Users, Send, Target, BarChart, Settings, Clock, FileText, CheckSquare } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Nova Rec",
    url: "/dashboard/nova-rec",
    icon: Users,
    description: "Cadastro de leads"
  },
  {
    title: "Pipeline",
    url: "/dashboard/pipeline",
    icon: Target,
    description: "Quadro Kanban"
  },
  {
    title: "Chat ao Vivo",
    url: "/dashboard/chat",
    icon: MessageSquare,
    description: "Integração WhatsApp"
  },
  {
    title: "Agendamentos",
    url: "/dashboard/schedule",
    icon: Calendar,
    description: "Central de agendamentos"
  },
  {
    title: "Envio em Massa",
    url: "/dashboard/bulk",
    icon: Send,
    description: "Envios em massa"
  },
  {
    title: "Follow-Up",
    url: "/dashboard/follow-up",
    icon: Users,
    description: "Gestão de leads"
  },
  {
    title: "Atrasos",
    url: "/dashboard/atrasos",
    icon: Clock,
    description: "Gestão de atrasos"
  },
  {
    title: "Sit Plan",
    url: "/dashboard/sitplan",
    icon: FileText,
    description: "Planos de situação"
  },
  {
    title: "TA",
    url: "/dashboard/ta",
    icon: CheckSquare,
    description: "Leads selecionados"
  },
  {
    title: "Relatório do TA",
    url: "/dashboard/reports",
    icon: BarChart,
    description: "Histórico de mudanças"
  },
  {
    title: "Configurações",
    url: "/dashboard/settings",
    icon: Settings,
    description: "Configurações"
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r bg-card" collapsible="icon">
      <SidebarHeader className="p-3 sm:p-4">
        <NavLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold truncate">CRM Nichado</h1>
              <p className="text-xs text-muted-foreground truncate">Dashboard de Vendas</p>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-1 sm:px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)} 
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url} className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg transition-colors">
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}