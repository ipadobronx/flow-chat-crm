import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

export default function TA() {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  useEffect(() => {
    // Get selected leads from localStorage
    const stored = localStorage.getItem('selectedLeadsForTA');
    if (stored) {
      setSelectedLeadIds(JSON.parse(stored));
    }
  }, []);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["ta-leads", selectedLeadIds],
    queryFn: async () => {
      if (selectedLeadIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("id", selectedLeadIds)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: selectedLeadIds.length > 0,
  });

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
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6">Carregando...</CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">TA</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leads Selecionados para TA</CardTitle>
          </CardHeader>

          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum lead foi enviado para TA ainda.</p>
                <p className="text-sm mt-2">Use o botão "Editar" no SitPlan para selecionar leads.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
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
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}