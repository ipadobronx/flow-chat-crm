import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone } from "lucide-react";

const chats = [
  { id: 1, name: "Sarah Johnson", stage: "Proposal", lastMessage: "When can we schedule the demo?", time: "2m", unread: 2 },
  { id: 2, name: "Michael Chen", stage: "Negotiation", lastMessage: "Thanks for the updated pricing", time: "15m", unread: 0 },
  { id: 3, name: "Emily Rodriguez", stage: "Contacted", lastMessage: "Hi, I'm interested in your service", time: "1h", unread: 1 },
];

export default function LiveChat() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Live Chat</h1>
          <p className="text-muted-foreground">WhatsApp integration with funnel filters</p>
        </div>

        <div className="sticky top-0 z-10 bg-background border-b py-4">
          <ToggleGroup type="single" defaultValue="all">
            <ToggleGroupItem value="all">All Chats</ToggleGroupItem>
            <ToggleGroupItem value="contacted">Contacted</ToggleGroupItem>
            <ToggleGroupItem value="proposal">Proposal</ToggleGroupItem>
            <ToggleGroupItem value="negotiation">Negotiation</ToggleGroupItem>
            <ToggleGroupItem value="closed">Closed</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Active Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {chats.map((chat) => (
                <div key={chat.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} />
                    <AvatarFallback>{chat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{chat.name}</p>
                      <span className="text-xs text-muted-foreground">{chat.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="secondary" className="text-xs">{chat.stage}</Badge>
                      {chat.unread > 0 && (
                        <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Chat with Sarah Johnson</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Select a conversation to start chatting
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}