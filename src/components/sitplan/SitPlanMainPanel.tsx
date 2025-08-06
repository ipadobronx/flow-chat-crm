import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, X, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Lead = Tables<"leads">;

interface SitPlanMainPanelProps {
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead | null) => void;
}

export function SitPlanMainPanel({ selectedLead, onSelectLead }: SitPlanMainPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEtapa, setSelectedEtapa] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: allLeads = [], refetch } = useQuery({
    queryKey: ["all-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.recomendante && Array.isArray(lead.recomendante) 
                           ? lead.recomendante.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
                           : false) ||
                         (lead.profissao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesEtapa = selectedEtapa ? lead.etapa === selectedEtapa : true;
    
    return matchesSearch && matchesEtapa;
  });

  const uniqueEtapas = Array.from(new Set(allLeads.map(lead => lead.etapa))).sort();

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

  const addToSitPlan = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await supabase
        .from("leads")
        .update({ incluir_sitplan: true })
        .eq("id", leadId);

      toast({
        title: "Lead adicionado ao SitPlan",
        description: "O lead foi adicionado com sucesso ao SitPlan.",
      });

      refetch();
      // Trigger refresh of sitplan sidebar immediately
      window.dispatchEvent(new CustomEvent('sitplan-updated'));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o lead ao SitPlan.",
        variant: "destructive"
      });
    }
  };

  // If a lead is selected, show detailed view
  if (selectedLead) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex-shrink-0 p-6 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectLead(null)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para todos os leads
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="max-w-4xl mx-auto">
            {/* Lead Header */}
            <div className="flex items-start gap-6 mb-8">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={`https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000 + 1547000000)}?w=200&h=200&fit=crop&crop=face`} />
                <AvatarFallback className="text-lg font-semibold bg-muted">
                  {getLeadInitials(selectedLead.nome)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-foreground mb-2">
                  {selectedLead.nome}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  {selectedLead.profissao || "Profissão não informada"}
                </p>
                <Badge 
                  variant="outline" 
                  className={cn("text-sm", getEtapaColor(selectedLead.etapa))}
                >
                  {selectedLead.etapa}
                </Badge>
              </div>
            </div>

            {/* Lead Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informações Pessoais</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <p className="text-sm text-foreground">{selectedLead.telefone || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm text-foreground">{selectedLead.email || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Idade</label>
                      <p className="text-sm text-foreground">{selectedLead.idade || "Não informada"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cidade</label>
                      <p className="text-sm text-foreground">{selectedLead.cidade || "Não informada"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Família</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Estado Civil</label>
                      <p className="text-sm text-foreground">{selectedLead.casado ? "Casado(a)" : "Solteiro(a)"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Filhos</label>
                      <p className="text-sm text-foreground">
                        {selectedLead.tem_filhos 
                          ? `Sim${selectedLead.quantidade_filhos ? ` (${selectedLead.quantidade_filhos})` : ""}`
                          : "Não"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informações Profissionais</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                      <p className="text-sm text-foreground">{selectedLead.empresa || "Não informada"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Renda Estimada</label>
                      <p className="text-sm text-foreground">{selectedLead.renda_estimada || "Não informada"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">PA Estimado</label>
                      <p className="text-sm text-foreground">{selectedLead.pa_estimado || "Não informado"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recomendações</h3>
                  <div className="space-y-2">
                    {selectedLead.recomendante && Array.isArray(selectedLead.recomendante) && selectedLead.recomendante.length > 0 ? (
                      selectedLead.recomendante.map((recomendante, index) => (
                        <p key={index} className="text-sm text-foreground">{recomendante}</p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma recomendação</p>
                    )}
                  </div>
                </div>

                {selectedLead.observacoes && (
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Observações</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedLead.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view: All leads table
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Todos os Leads</h2>
          
          <Select value={selectedEtapa || "all"} onValueChange={(value) => setSelectedEtapa(value === "all" ? null : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {uniqueEtapas.map((etapa) => (
                <SelectItem key={etapa} value={etapa}>
                  {etapa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, recomendante ou profissão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 min-h-0">
        <div className="rounded-xl border border-border bg-card h-full overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-auto">
            <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="font-semibold text-muted-foreground">NOME</TableHead>
                <TableHead className="font-semibold text-muted-foreground">ETAPA</TableHead>
                <TableHead className="font-semibold text-muted-foreground">RECOMENDANTE</TableHead>
                <TableHead className="font-semibold text-muted-foreground">PROFISSÃO</TableHead>
                <TableHead className="font-semibold text-muted-foreground">TELEFONE</TableHead>
                <TableHead className="font-semibold text-muted-foreground">CASADO</TableHead>
                <TableHead className="font-semibold text-muted-foreground">FILHOS</TableHead>
                <TableHead className="font-semibold text-muted-foreground">OBSERVAÇÕES</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow 
                  key={lead.id}
                  className="hover:bg-muted/50 transition-colors border-border group"
                  onMouseEnter={() => setHoveredRow(lead.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <TableCell className="font-medium text-foreground">{lead.nome}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn("text-xs", getEtapaColor(lead.etapa))}
                    >
                      {lead.etapa}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.recomendante && Array.isArray(lead.recomendante) && lead.recomendante.length > 0 
                      ? lead.recomendante.join(', ')
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.profissao || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.telefone || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.casado ? "SIM" : "NÃO"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.tem_filhos ? `SIM${lead.quantidade_filhos ? ` (${lead.quantidade_filhos})` : ""}` : "NÃO"}
                  </TableCell>
                   <TableCell className="max-w-[200px] truncate text-muted-foreground">
                     {lead.observacoes || "-"}
                   </TableCell>
                  <TableCell>
                    {hoveredRow === lead.id && !lead.incluir_sitplan && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => addToSitPlan(lead.id, e)}
                        className="w-8 h-8 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                    {lead.incluir_sitplan && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        No SitPlan
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}