import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { ImportedData, FieldMapping } from "@/pages/ImportLeads";
import { convertImportedData, mapEtapaToEnum } from "@/lib/importUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { sanitizeText, validateLeadName, validatePhoneNumber, validateEmail } from "@/lib/validation";

interface ImportPreviewProps {
  data: ImportedData;
  mappings: FieldMapping[];
  onImportComplete: () => void;
  onBack: () => void;
}

export function ImportPreview({ data, mappings, onImportComplete, onBack }: ImportPreviewProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const { user } = useAuth();

  const previewData = useMemo(() => {
    return convertImportedData(data.rows, mappings);
  }, [data.rows, mappings]);

  const validatedData = useMemo(() => {
    return previewData.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validar nome (obrigatório)
      if (!row.nome) {
        errors.push("Nome é obrigatório");
      } else {
        const nameValidation = validateLeadName(row.nome);
        if (!nameValidation.isValid) {
          errors.push("Nome inválido");
        } else {
          row.nome = nameValidation.sanitized;
        }
      }

      // Validar telefone se presente
      if (row.telefone) {
        const phoneValidation = validatePhoneNumber(row.telefone);
        if (!phoneValidation.isValid) {
          warnings.push("Telefone em formato inválido");
          row.telefone = phoneValidation.sanitized;
        } else {
          row.telefone = phoneValidation.sanitized;
        }
      }

      // Validar email se presente
      if (row.email) {
        const isValidEmail = validateEmail(row.email);
        if (!isValidEmail) {
          warnings.push("Email em formato inválido");
        }
      }

      // Sanitizar campos de texto
      if (row.observacoes) {
        row.observacoes = sanitizeText(row.observacoes);
      }
      if (row.profissao) {
        row.profissao = sanitizeText(row.profissao);
      }
      if (row.cidade) {
        row.cidade = sanitizeText(row.cidade);
      }
      if (row.empresa) {
        row.empresa = sanitizeText(row.empresa);
      }

      return {
        ...row,
        _rowIndex: index + 1,
        _errors: errors,
        _warnings: warnings,
        _isValid: errors.length === 0
      };
    });
  }, [previewData]);

  const validRecords = validatedData.filter(row => row._isValid);
  const invalidRecords = validatedData.filter(row => !row._isValid);

  const handleImport = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      const leadsToImport = validRecords.map(row => ({
        user_id: user.id,
        nome: row.nome,
        telefone: row.telefone || null,
        email: row.email || null,
        idade: row.idade || null,
        data_nascimento: row.data_nascimento || null,
        profissao: row.profissao || null,
        cidade: row.cidade || null,
        renda_estimada: row.renda_estimada || null,
        empresa: row.empresa || null,
        observacoes: row.observacoes || null,
        casado: row.casado || null,
        tem_filhos: row.tem_filhos || null,
        quantidade_filhos: row.quantidade_filhos || null,
        celular_secundario: row.celular_secundario || null,
        pa_estimado: row.pa_estimado || null,
        valor: row.valor || null,
        recomendante: row.recomendante ? [row.recomendante] : null,
        etapa: mapEtapaToEnum(row.etapa) as any,
        incluir_ta: false,
        incluir_sitplan: false,
        high_ticket: false,
        avisado: false
      }));

      // Importar em lotes de 50
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < leadsToImport.length; i += batchSize) {
        batches.push(leadsToImport.slice(i, i + batchSize));
      }

      let totalImported = 0;
      const errors: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setProgress(((i + 1) / batches.length) * 100);

        try {
          const { error } = await supabase
            .from('leads')
            .insert(batch);

          if (error) {
            errors.push(`Erro no lote ${i + 1}: ${error.message}`);
          } else {
            totalImported += batch.length;
          }
        } catch (error) {
          errors.push(`Erro no lote ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }

        // Pequena pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResult({
        success: totalImported,
        errors
      });

      if (totalImported > 0) {
        toast.success(`${totalImported} leads importados com sucesso!`);
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} erros durante a importação`);
      }

    } catch (error) {
      console.error("Erro na importação:", error);
      toast.error("Erro inesperado durante a importação");
      setImportResult({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (importResult) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {importResult.success > 0 ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-500" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Importação Concluída</h3>
            <p className="text-muted-foreground">
              {importResult.success} de {validRecords.length} registros importados com sucesso
            </p>
          </div>
        </div>

        {importResult.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Erros encontrados:</strong></p>
                {importResult.errors.map((error, index) => (
                  <div key={index} className="text-sm">• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button onClick={onImportComplete}>
            Nova Importação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Preview da Importação</h3>
          <p className="text-muted-foreground">
            Revise os dados antes de confirmar a importação
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{validRecords.length}</div>
          <div className="text-sm text-green-700">Registros válidos</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{invalidRecords.length}</div>
          <div className="text-sm text-red-700">Registros com erro</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.rows.length}</div>
          <div className="text-sm text-blue-700">Total de registros</div>
        </div>
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            Importando dados... {Math.round(progress)}%
          </p>
        </div>
      )}

      <div className="border rounded-lg max-h-96 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Linha</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Recomendante</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validatedData.slice(0, 100).map((row, index) => (
              <TableRow key={index} className={!row._isValid ? "bg-red-50" : ""}>
                <TableCell>{row._rowIndex}</TableCell>
                <TableCell>{row.nome || "-"}</TableCell>
                <TableCell>{row.telefone || "-"}</TableCell>
                <TableCell>{row.email || "-"}</TableCell>
                <TableCell>{row.recomendante || "-"}</TableCell>
                <TableCell>
                  {row._isValid ? (
                    <span className="text-green-600 text-sm">✓ Válido</span>
                  ) : (
                    <span className="text-red-600 text-sm">
                      ✗ {row._errors?.[0] || "Erro"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {validatedData.length > 100 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando apenas os primeiros 100 registros. Todos os registros válidos serão importados.
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <Button 
          onClick={handleImport}
          disabled={isImporting || validRecords.length === 0}
        >
          <Upload className="w-4 h-4 mr-2" />
          Importar {validRecords.length} Leads
        </Button>
      </div>
    </div>
  );
}