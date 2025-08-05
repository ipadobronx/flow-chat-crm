import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";

export interface ImportedData {
  headers: string[];
  rows: any[][];
}

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

export default function ImportLeads() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ImportLeads component mounted successfully');
    
    // Verificar se as dependências estão disponíveis
    try {
      import('react-dropzone').then(() => {
        console.log('react-dropzone carregado com sucesso');
      }).catch((err) => {
        console.error('Erro ao carregar react-dropzone:', err);
        setError('Erro ao carregar dependências de upload');
      });

      import('xlsx').then(() => {
        console.log('xlsx carregado com sucesso');
      }).catch((err) => {
        console.error('Erro ao carregar xlsx:', err);
        setError('Erro ao carregar dependências de planilha');
      });
    } catch (err) {
      console.error('Erro geral:', err);
      setError('Erro ao inicializar componente');
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Importar Leads</h2>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Sistema de Importação</h3>
            </div>
            
            <div className="text-center space-y-4 py-8">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Funcionalidade em Carregamento
                </h3>
                <p className="text-muted-foreground">
                  O sistema de importação está sendo inicializado...
                </p>
              </div>

              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Recarregar Página
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Funcionalidades planejadas:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Upload de arquivos Excel (.xlsx, .xls) e CSV</li>
                <li>Mapeamento inteligente de campos</li>
                <li>Validação automática de dados</li>
                <li>Preview antes da importação</li>
                <li>Histórico de importações</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}