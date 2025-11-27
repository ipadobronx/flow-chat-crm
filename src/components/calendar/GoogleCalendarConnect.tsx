import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import googleCalendarLogo from "@/assets/google-calendar-logo.png";

export const GoogleCalendarConnect = () => {
  const { isConnected, isLoading, connect, disconnect, isConnecting, isDisconnecting } = useGoogleCalendar();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              onClick={() => isConnected ? disconnect() : connect()}
              disabled={isConnecting || isDisconnecting}
              variant={isConnected ? "outline" : "ghost"}
              size="icon"
              className="relative h-8 w-8 sm:h-9 sm:w-9 p-1.5 hover:bg-white/10 bg-white/5 border-white/10"
            >
              {(isConnecting || isDisconnecting) ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <img 
                  src={googleCalendarLogo} 
                  alt="Google Calendar" 
                  className="h-full w-full object-contain"
                />
              )}
            </Button>
            {isConnected && (
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 border border-background" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isConnected ? "Desconectar Google Calendar" : "Conectar Google Calendar"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
