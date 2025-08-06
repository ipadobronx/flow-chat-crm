import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Phone, CheckCircle, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

interface SitPlanLeadsListProps {
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
}

export function SitPlanLeadsList({ selectedLead, onSelectLead }: SitPlanLeadsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["sitplan-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "pendente") return matchesSearch && lead.status !== "Concluído";
    if (activeTab === "feito") return matchesSearch && lead.status === "Concluído";
    
    return matchesSearch;
  });

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "Concluído":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "Não Atendeu":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const getPriorityBadge = (highTicket: boolean | null, valor: string | null) => {
    if (highTicket) return <Badge variant="destructive">Alta</Badge>;
    if (valor && parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) > 50000) {
      return <Badge className="bg-warning text-warning-foreground">Média</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Baixa</Badge>;
  };

  if (isLoading) {
    return <Card className="h-full"><CardContent className="p-6">Carregando...</CardContent></Card>;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Leads para Ligação
        </CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendente</TabsTrigger>
            <TabsTrigger value="feito">Feito</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                selectedLead?.id === lead.id ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`https://source.unsplash.com/40x40/?person,face&${lead.id}`} />
                  <AvatarFallback>{lead.nome.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{lead.nome}</h4>
                      {lead.etapa !== "Todos" && (
                        <Badge variant="outline" className="text-xs">
                          {lead.dias_na_etapa_atual || 1}d
                        </Badge>
                      )}
                    </div>
                    {getStatusIcon(lead.status)}
                  </div>
                  
                  {lead.empresa && (
                    <p className="text-sm text-muted-foreground truncate">{lead.empresa}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(lead.high_ticket, lead.valor)}
                    </div>
                    
                    {lead.valor && (
                      <span className="text-sm font-medium text-primary">
                        R$ {lead.valor}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredLeads.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum lead encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}