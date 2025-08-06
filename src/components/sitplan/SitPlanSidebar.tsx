import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Lead = Tables<"leads">;

interface SitPlanSidebarProps {
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead | null) => void;
}

export function SitPlanSidebar({ selectedLead, onSelectLead }: SitPlanSidebarProps) {
  const { data: sitPlanLeads = [], refetch } = useQuery({
    queryKey: ["sitplan-selected-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("incluir_sitplan", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 1000, // Refetch every second to get immediate updates
  });

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case "Novo": return "bg-blue-100 text-blue-800 border-blue-200";
      case "OI": return "bg-green-100 text-green-800 border-green-200";
      case "PC": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "N": return "bg-red-100 text-red-800 border-red-200";
      case "Apólice Emitida": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Apólice Entregue": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLeadInitials = (nome: string) => {
    return nome
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const removeFromSitPlan = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    await supabase
      .from("leads")
      .update({ incluir_sitplan: false })
      .eq("id", leadId);
    
    refetch();
  };

  return (
    <div className="w-full lg:w-80 flex flex-col h-auto lg:h-full border-r-0 lg:border-r border-b lg:border-b-0 border-border bg-card min-h-[300px] lg:min-h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Leads Selecionados para SitPlan
        </h2>
        <p className="text-sm text-muted-foreground">
          {sitPlanLeads.length} lead{sitPlanLeads.length !== 1 ? 's' : ''} selecionado{sitPlanLeads.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sitPlanLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Nenhum lead selecionado
            </h3>
            <p className="text-xs text-muted-foreground">
              Adicione leads da tabela ao lado para começar a organizar seu SitPlan
            </p>
          </div>
        ) : (
          sitPlanLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onSelectLead(selectedLead?.id === lead.id ? null : lead)}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm",
                selectedLead?.id === lead.id
                  ? "bg-primary/5 border-primary/20 shadow-sm"
                  : "bg-background border-border hover:border-border/80"
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={`https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000 + 1547000000)}?w=100&h=100&fit=crop&crop=face`} />
                  <AvatarFallback className="text-xs font-medium bg-muted">
                    {getLeadInitials(lead.nome)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {lead.nome}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => removeFromSitPlan(lead.id, e)}
                      className="w-6 h-6 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={cn("text-xs mb-2", getEtapaColor(lead.etapa))}
                  >
                    {lead.etapa}
                  </Badge>

                  <p className="text-xs text-muted-foreground truncate">
                    {lead.profissao || "Profissão não informada"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}