import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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

  const filteredLeads = leads.filter(lead => 
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.recomendante?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (lead.profissao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleLeadSelect = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSendToTA = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione pelo menos um lead para enviar para TA.",
        variant: "destructive"
      });
      return;
    }

    // Store selected leads in localStorage for now
    localStorage.setItem('selectedLeadsForTA', JSON.stringify(selectedLeads));
    
    toast({
      title: "Leads enviados para TA",
      description: `${selectedLeads.length} lead(s) enviado(s) para o menu TA.`,
    });

    setSelectedLeads([]);
    setIsEditMode(false);
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case "Novo": return "bg-blue-500";
      case "OI": return "bg-green-500";
      case "PC": return "bg-yellow-500";
      case "N": return "bg-red-500";
      case "Apólice Emitida": return "bg-purple-500";
      case "Apólice Entregue": return "bg-green-600";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Carregando...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Todos os Leads</CardTitle>
          <div className="flex gap-2">
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
                    <Badge className={`text-white ${getEtapaColor(lead.etapa)}`}>
                      {lead.etapa}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.recomendante || "-"}</TableCell>
                  <TableCell>{lead.profissao || "-"}</TableCell>
                  <TableCell>{lead.telefone || "-"}</TableCell>
                  <TableCell>{lead.casado ? "SIM" : "NÃO"}</TableCell>
                  <TableCell>{lead.tem_filhos ? "SIM" : "NÃO"}</TableCell>
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