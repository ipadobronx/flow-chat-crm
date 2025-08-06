import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Edit, Send, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Lead = Tables<"leads">;

export function SitPlanLeadsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedEtapa, setSelectedEtapa] = useState<string | null>(null);
  const { toast } = useToast();

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
                         (lead.recomendante && Array.isArray(lead.recomendante) 
                           ? lead.recomendante.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
                           : false) ||
                         (lead.profissao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesEtapa = selectedEtapa ? lead.etapa === selectedEtapa : true;
    
    return matchesSearch && matchesEtapa;
  });

  const handleLeadSelect = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleAddToSitPlan = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione pelo menos um lead para adicionar ao SitPlan.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("leads")
        .update({ incluir_sitplan: true })
        .in("id", selectedLeads);

      if (error) throw error;

      toast({
        title: "Leads adicionados ao SitPlan",
        description: `${selectedLeads.length} lead(s) adicionado(s) aos selecionados para o SitPlan.`,
      });

      setSelectedLeads([]);
      setIsEditMode(false);
    } catch (error) {
      console.error("Erro ao adicionar leads ao SitPlan:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar leads ao SitPlan.",
        variant: "destructive"
      });
    }
  };

  const handleEtapaClick = (etapa: string) => {
    if (selectedEtapa === etapa) {
      setSelectedEtapa(null); // Remove filter if clicking the same etapa
    } else {
      setSelectedEtapa(etapa);
    }
  };

  const getEtapaColor = (etapa: string, isSelected?: boolean) => {
    const baseColor = (() => {
      switch (etapa) {
        case "Todos": return "bg-blue-500";
        case "Novo": return "bg-sky-500";
        case "TA": return "bg-purple-600";
        case "Não atendido": return "bg-red-600";
        case "Ligar Depois": return "bg-yellow-600";
        case "Marcar": return "bg-green-600";
        case "OI": return "bg-indigo-500";
        case "Delay OI": return "bg-yellow-500";
        case "PC": return "bg-orange-500";
        case "Delay PC": return "bg-red-500";
        case "Analisando Proposta": return "bg-orange-600";
        case "N": return "bg-purple-500";
        case "Proposta Não Apresentada": return "bg-gray-600";
        case "Pendência de UW": return "bg-yellow-700";
        case "Apólice Emitida": return "bg-green-500";
        case "Apólice Entregue": return "bg-emerald-500";
        case "Delay C2": return "bg-cyan-500";
        case "Não": return "bg-gray-500";
        case "Proposta Cancelada": return "bg-red-600";
        case "Apólice Cancelada": return "bg-red-700";
        default: return "bg-gray-500";
      }
    })();
    
    return isSelected ? `${baseColor} ring-2 ring-offset-2 ring-primary` : baseColor;
  };

  // Get unique etapas from leads
  const uniqueEtapas = Array.from(new Set(leads.map(lead => lead.etapa))).sort();

  if (isLoading) {
    return <Card><CardContent className="p-6">Carregando...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Todos os Leads</CardTitle>
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
          <div className="flex gap-2">
            {selectedEtapa && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedEtapa(null)}
              >
                Limpar filtro: {selectedEtapa}
              </Button>
            )}
            {isEditMode && (
              <Button onClick={handleAddToSitPlan} className="gap-2">
                <Send className="w-4 h-4" />
                Adicionar ao SitPlan ({selectedLeads.length})
              </Button>
            )}
            <Button 
              size="sm"
              className={`h-8 w-8 p-0 rounded-full shadow-sm border-0 transition-all duration-200 hover:scale-105 ${
                isEditMode 
                  ? "bg-blue-600 text-white" 
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              onClick={() => {
                setIsEditMode(!isEditMode);
                if (!isEditMode) setSelectedLeads([]);
              }}
              title="Selecionar leads para SitPlan"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {isEditMode && <TableHead className="w-12"></TableHead>}
                <TableHead>NOME</TableHead>
                <TableHead>ETAPA</TableHead>
                <TableHead>RECOMENDANTE</TableHead>
                <TableHead>PROFISSÃO</TableHead>
                <TableHead>TELEFONE</TableHead>
                <TableHead>CASADO</TableHead>
                <TableHead>FILHOS</TableHead>
                <TableHead>OBSERVAÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  {isEditMode && (
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => 
                          handleLeadSelect(lead.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`text-white cursor-pointer hover:opacity-80 transition-opacity ${getEtapaColor(lead.etapa, selectedEtapa === lead.etapa)}`}
                      onClick={() => handleEtapaClick(lead.etapa)}
                    >
                      {lead.etapa}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.recomendante && Array.isArray(lead.recomendante) && lead.recomendante.length > 0 
                      ? lead.recomendante.join(', ')
                      : "-"
                    }
                  </TableCell>
                  <TableCell>{lead.profissao || "-"}</TableCell>
                  <TableCell>{lead.telefone || "-"}</TableCell>
                  <TableCell>{lead.casado ? "SIM" : "NÃO"}</TableCell>
                  <TableCell>
                    {lead.tem_filhos ? `SIM${lead.quantidade_filhos ? ` (${lead.quantidade_filhos})` : ""}` : "NÃO"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {lead.observacoes || "-"}
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isEditMode ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}