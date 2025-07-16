import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

export function SitPlanLeadsTable() {
  const [searchTerm, setSearchTerm] = useState("");

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

  if (isLoading) {
    return <Card><CardContent className="p-6">Carregando...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos os Leads</CardTitle>
        
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
                <TableHead>NOME</TableHead>
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
                  <TableCell className="font-medium">{lead.nome}</TableCell>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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