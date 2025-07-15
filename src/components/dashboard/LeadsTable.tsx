import { useState } from "react";
import { MoreHorizontal, Phone, Mail, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const leads = [
  {
    id: 1,
    name: "Sarah Johnson",
    company: "TechStart Inc.",
    email: "sarah@techstart.com",
    phone: "+55 (11) 91234-5678",
    stage: "Proposta",
    value: "R$ 25.000",
    lastContact: "2 horas atrás",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "Michael Chen",
    company: "Digital Solutions",
    email: "m.chen@digsol.com",
    phone: "+55 (11) 98765-4321",
    stage: "Negociação",
    value: "R$ 45.000",
    lastContact: "1 dia atrás",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    company: "Growth Co.",
    email: "emily@growthco.com",
    phone: "+55 (11) 94567-8901",
    stage: "Qualificado",
    value: "R$ 18.500",
    lastContact: "3 horas atrás",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 4,
    name: "David Park",
    company: "Innovation Labs",
    email: "david@innovlabs.com",
    phone: "+55 (11) 93210-9876",
    stage: "Contatado",
    value: "R$ 32.000",
    lastContact: "5 horas atrás",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  }
];

const getStageColor = (stage: string) => {
  switch (stage) {
    case "Contatado": return "secondary";
    case "Qualificado": return "default";
    case "Proposta": return "outline";
    case "Negociação": return "destructive";
    default: return "secondary";
  }
};

export function LeadsTable() {
  const [selectedLead, setSelectedLead] = useState<any>(null);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Leads Ativos</CardTitle>
        <CardDescription className="text-sm">
          Gerencie seu pipeline de vendas e acompanhe o progresso dos leads
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {/* Mobile View */}
        <div className="block sm:hidden space-y-3 px-4">
          {leads.map((lead) => (
            <div 
              key={lead.id}
              className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setSelectedLead(lead)}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={lead.avatar} />
                  <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">{lead.name}</p>
                    <Badge variant={getStageColor(lead.stage)} className="text-xs">{lead.stage}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{lead.company}</p>
                  <p className="text-sm font-semibold text-success">{lead.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lead.lastContact}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Phone className="mr-2 h-4 w-4" />
                      Ligar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      WhatsApp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead className="hidden md:table-cell">Empresa</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="hidden lg:table-cell">Valor</TableHead>
                <TableHead className="hidden xl:table-cell">Último Contato</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={lead.avatar} />
                        <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{lead.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-medium">{lead.company}</TableCell>
                  <TableCell>
                    <Badge variant={getStageColor(lead.stage)}>{lead.stage}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-semibold text-success">{lead.value}</TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">{lead.lastContact}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Phone className="mr-2 h-4 w-4" />
                          Ligar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}