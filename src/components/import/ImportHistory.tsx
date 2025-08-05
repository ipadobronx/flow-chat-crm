import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, Download, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ImportRecord {
  id: string;
  created_at: string;
  details: any;
}

export function ImportHistory() {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadImportHistory();
  }, [user]);

  const loadImportHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'import_leads')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setImports((data || []).map(item => ({
        id: item.id,
        created_at: item.created_at,
        details: typeof item.details === 'object' ? item.details : {}
      })));
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (record: ImportRecord) => {
    const details = record.details || {};
    const { totalRecords = 0, successfulRecords = 0, errors = [] } = details;
    
    if (successfulRecords === totalRecords && totalRecords > 0) {
      return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
    } else if (successfulRecords > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Falha</Badge>;
    }
  };

  const getStatusIcon = (record: ImportRecord) => {
    const details = record.details || {};
    const { totalRecords = 0, successfulRecords = 0 } = details;
    
    if (successfulRecords === totalRecords && totalRecords > 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (successfulRecords > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (imports.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Nenhuma importação encontrada</h3>
            <p className="text-muted-foreground">
              Suas importações de leads aparecerão aqui
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Histórico de Importações</h3>
          <Button variant="outline" size="sm" onClick={loadImportHistory}>
            <Download className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record)}
                      <span className="text-sm">
                        {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {record.details?.fileName || 'Arquivo não especificado'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        <strong>{record.details?.successfulRecords || 0}</strong> de{' '}
                        <strong>{record.details?.totalRecords || 0}</strong> importados
                      </div>
                      {(record.details?.errors?.length || 0) > 0 && (
                        <div className="text-red-600">
                          {record.details.errors.length} erro(s)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(record.details?.errors?.length || 0) > 0 && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            {(record.details.errors || []).slice(0, 3).map((error: string, index: number) => (
                              <div key={index} className="text-xs">• {error}</div>
                            ))}
                            {(record.details.errors?.length || 0) > 3 && (
                              <div className="text-xs">
                                ... e mais {(record.details.errors?.length || 0) - 3} erro(s)
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Mostrando as últimas 50 importações
        </div>
      </div>
    </Card>
  );
}