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
              className="relative h-10 w-10"
            >
              {(isConnecting || isDisconnecting) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d="M17,12V3a1,1,0,0,0-2,0v9a5,5,0,0,0-4,4.9V19H7v4a1,1,0,0,0,1,1h8a1,1,0,0,0,1-1V19H13V16.9A5,5,0,0,0,17,12Z" />
                  <circle cx="12" cy="2" r="2" />
                </svg>
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
