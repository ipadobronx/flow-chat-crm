import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

export const GoogleCalendarConnect = () => {
  const { isConnected, isLoading, connect, disconnect, isConnecting, isDisconnecting } = useGoogleCalendar();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Google Calendar</CardTitle>
        </div>
        <CardDescription>
          {isConnected
            ? "Seus agendamentos serão sincronizados automaticamente"
            : "Conecte sua conta Google para sincronizar automaticamente"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Conectado e sincronizando
            </div>
            <Button
              variant="outline"
              onClick={() => disconnect()}
              disabled={isDisconnecting}
            >
              {isDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desconectar
            </Button>
          </div>
        ) : (
          <Button onClick={() => connect()} disabled={isConnecting}>
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Calendar className="mr-2 h-4 w-4" />
            Conectar Google Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
