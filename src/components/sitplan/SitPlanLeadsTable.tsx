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
import { Search, Edit, Send } from "lucide-react";
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

  const handleSendToTA = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione pelo menos um lead para enviar para TA.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current highest TA order
      const { data: existingTALeads, error: fetchError } = await supabase
        .from("leads")
        .select("ta_order")
        .eq("incluir_ta", true)
        .order("ta_order", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const startOrder = existingTALeads.length > 0 ? existingTALeads[0].ta_order + 1 : 1;

      // Update all selected leads to be included in TA with sequential order
      for (let i = 0; i < selectedLeads.length; i++) {
        const { error } = await supabase
          .from("leads")
          .update({ 
            incluir_ta: true,
            ta_order: startOrder + i
          })
          .eq("id", selectedLeads[i]);

        if (error) throw error;
      }
      
      toast({
        title: "Leads enviados para TA",
        description: `${selectedLeads.length} lead(s) enviado(s) para o menu TA.`,
      });

      setSelectedLeads([]);
      setIsEditMode(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar os leads para TA.",
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
        case "Novo": return "blue-500";
        case "OI": return "green-500";
        case "PC": return "yellow-500";
        case "N": return "red-500";
        case "Apólice Emitida": return "purple-500";
        case "Apólice Entregue": return "green-600";
        default: return "gray-500";
      }
    })();
    
    return isSelected ? `bg-${baseColor} ring-2 ring-${baseColor} ring-opacity-50` : `bg-${baseColor}`;
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
              <Button onClick={handleSendToTA} className="gap-2">
                <Send className="w-4 h-4" />
                Enviar para TA ({selectedLeads.length})
              </Button>
            )}
            <Button 
              variant={isEditMode ? "secondary" : "outline"}
              onClick={() => {
                setIsEditMode(!isEditMode);
                if (!isEditMode) setSelectedLeads([]);
              }}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditMode ? "Cancelar" : "Editar"}
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