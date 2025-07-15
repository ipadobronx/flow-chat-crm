import { Calendar, MessageSquare, Users, Send, Target, BarChart, Settings, Clock, FileText } from "lucide-react";
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
    title: "Relatórios",
    url: "/dashboard/reports",
    icon: BarChart,
    description: "Analytics & insights"
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
      <SidebarHeader className="p-4">
        <NavLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold">CRM Nichado</h1>
              <p className="text-xs text-muted-foreground">Dashboard de Vendas</p>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)} 
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url} className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors">
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && (
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
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