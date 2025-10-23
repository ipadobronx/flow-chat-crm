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
              variant={isConnected ? "outline" : "default"}
              size="icon"
              className="relative h-10 w-10 p-2"
            >
              {(isConnecting || isDisconnecting) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <img 
                  src={googleCalendarLogo} 
                  alt="Google Calendar" 
                  className="h-full w-full object-contain"
                />
              )}
            </Button>
            {isConnected && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
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
