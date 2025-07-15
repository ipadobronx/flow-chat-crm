import { Bell, Search, User, LogOut } from "lucide-react";
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

export function TopBar() {
  const { user, signOut } = useAuth();
  
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
        <SidebarTrigger className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold truncate">Dashboard de Vendas</h2>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Bem-vindo, {user?.email?.split('@')[0] || 'Usuário'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
        {/* Theme Toggle */}
        <ThemeToggle />

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
                <AvatarFallback>JD</AvatarFallback>
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
  );
}