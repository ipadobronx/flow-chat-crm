import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Eye, EyeOff, FileWarning } from "lucide-react";
import { ImportedData, FieldMapping } from "@/pages/ImportLeads";
import { convertImportedDataWithDiagnostics, determineEtapaFinal, ImportDiagnostics } from "@/lib/importUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { sanitizeText, validateLeadName, validatePhoneNumber, validateEmail } from "@/lib/validation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Função para normalizar profissões - espelha a lógica do banco
const normalizarProfissao = (profissao: string): string => {
  if (!profissao) return '';
  
  const p = profissao.trim().toLowerCase();
  
  // Mapeamento de profissões
  if (['medico', 'médico', 'medica', 'médica'].includes(p)) return 'Médico(a)';
  if (['empresario', 'empresário', 'empresaria', 'empresária', 'empreendedor', 'empreendedora'].includes(p)) return 'Empresário(a)';
  if (['advogado', 'advogada'].includes(p)) return 'Advogado(a)';
  if (['psicologo', 'psicólogo', 'psicologa', 'psicóloga'].includes(p)) return 'Psicólogo(a)';
  if (['enfermeiro', 'enfermeira'].includes(p)) return 'Enfermeiro(a)';
  if (['contador', 'contadora'].includes(p)) return 'Contador(a)';
  if (p.includes('engenheir')) return 'Engenheiro(a)';
  if (['arquiteto', 'arquiteta'].includes(p)) return 'Arquiteto(a)';
  if (['bancario', 'bancário', 'bancaria', 'bancária'].includes(p)) return 'Bancário(a)';
  if (['procurador', 'procuradora', 'procuradoria do estado'].includes(p)) return 'Procurador(a)';
  if (['professor', 'professora'].includes(p)) return 'Professor(a)';
  if (['fotografo', 'fotógrafo', 'fotografa', 'fotógrafa'].includes(p)) return 'Fotógrafo(a)';
  if (['biologo', 'biólogo', 'biologa', 'bióloga'].includes(p)) return 'Biólogo(a)';
  if (['fonoaudiologo', 'fonoaudiólogo', 'fonoaudiologa', 'fonoaudióloga'].includes(p)) return 'Fonoaudiólogo(a)';
  if (['farmaceutico', 'farmacêutico', 'farmaceutica', 'farmacêutica'].includes(p)) return 'Farmacêutico(a)';
  if (p.includes('servidor') || p.includes('funcionário público') || p.includes('funcionario publico')) return 'Servidor Público';
  if (p.includes('corretor')) return 'Corretor(a) de Imóveis';
  if (['administrador', 'administradora'].includes(p)) return 'Administrador(a)';
  if (['dentista', 'cirurgião dentista', 'cirurgia dentista', 'cirurgiao dentista'].includes(p)) return 'Dentista';
  if (['programador', 'programadora', 'desenvolvedor', 'desenvolvedora'].includes(p)) return 'Programador(a)';
  if (p.includes('estudante')) return 'Estudante';
  if (['vendedor', 'vendedora'].includes(p)) return 'Vendedor(a)';
  if (['fisioterapeuta', 'fisioterapia'].includes(p)) return 'Fisioterapeuta';
  if (['nutricionista', 'nutricao', 'nutrição'].includes(p)) return 'Nutricionista';
  if (['personal trainer', 'personal', 'educador fisico', 'educador físico'].includes(p)) return 'Personal Trainer';
  if (['economista', 'economia'].includes(p)) return 'Economista';
  if (p.includes('marketing')) return 'Marketing';
  if (['piloto', 'aviador', 'aviadora'].includes(p)) return 'Piloto';
  if (p.includes('representante')) return 'Representante Comercial';
  
  return 'Outro';
};

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
  const [showRejected, setShowRejected] = useState(false);
  const { user } = useAuth();

  // Usar a nova função com diagnósticos
  const { previewData, diagnostics } = useMemo(() => {
    const result = convertImportedDataWithDiagnostics(data.rows, mappings);
    return { previewData: result.convertedData, diagnostics: result.diagnostics };
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

      // Normalizar profissão usando a mesma lógica do banco
      if (row.profissao) {
        row.profissao = normalizarProfissao(sanitizeText(row.profissao));
      }

      // Sanitizar campos de texto
      if (row.observacoes) {
        row.observacoes = sanitizeText(row.observacoes);
      }
      if (row.cidade) {
        row.cidade = sanitizeText(row.cidade);
      }
      if (row.empresa) {
        row.empresa = sanitizeText(row.empresa);
      }

      return {
        ...row,
        _rowIndex: row._originalRowIndex || index + 1,
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
        etapa: determineEtapaFinal(row.etapa, row.status) as any,
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

  // Calcular total de registros rejeitados
  const totalRejected = diagnostics.rejectedRows.length;
  const hasRejectedRows = totalRejected > 0;

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

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diagnostics.totalOriginal}</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total na planilha</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validRecords.length}</div>
          <div className="text-sm text-green-700 dark:text-green-300">Prontos para importar</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{invalidRecords.length}</div>
          <div className="text-sm text-amber-700 dark:text-amber-300">Com erros de validação</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalRejected}</div>
          <div className="text-sm text-red-700 dark:text-red-300">Rejeitados (sem nome)</div>
        </div>
      </div>

      {/* Alerta de diagnóstico detalhado */}
      {hasRejectedRows && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800">
          <FileWarning className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                {totalRejected} registros foram rejeitados antes da validação:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {diagnostics.rejectedByReason.noNameMapped > 0 && (
                  <li>
                    <strong>{diagnostics.rejectedByReason.noNameMapped}</strong> - Campo "nome" não foi mapeado
                  </li>
                )}
                {diagnostics.rejectedByReason.emptyName > 0 && (
                  <li>
                    <strong>{diagnostics.rejectedByReason.emptyName}</strong> - Nome vazio ou não preenchido
                  </li>
                )}
                {diagnostics.rejectedByReason.shortName > 0 && (
                  <li>
                    <strong>{diagnostics.rejectedByReason.shortName}</strong> - Nome muito curto (menos de 2 caracteres)
                  </li>
                )}
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejected(!showRejected)}
                className="mt-2"
              >
                {showRejected ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ocultar rejeitados
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver registros rejeitados
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de registros rejeitados */}
      {showRejected && hasRejectedRows && (
        <div className="border rounded-lg border-red-200 dark:border-red-800">
          <div className="bg-red-50 dark:bg-red-950/50 p-3 border-b border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-800 dark:text-red-300">
              Registros Rejeitados ({totalRejected})
            </h4>
          </div>
          <ScrollArea className="max-h-60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Linha</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Dados Originais</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnostics.rejectedRows.slice(0, 50).map((rejected, index) => (
                  <TableRow key={index} className="bg-red-50/50 dark:bg-red-950/20">
                    <TableCell className="font-mono text-sm">{rejected.rowIndex}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="text-xs">
                        {rejected.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                      {Object.entries(rejected.originalData)
                        .filter(([_, v]) => v)
                        .slice(0, 4)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {totalRejected > 50 && (
            <div className="p-2 text-center text-sm text-muted-foreground border-t border-red-200 dark:border-red-800">
              Mostrando 50 de {totalRejected} registros rejeitados
            </div>
          )}
        </div>
      )}

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            Importando dados... {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Tabs para válidos e inválidos */}
      <Tabs defaultValue="valid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="valid" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Válidos ({validRecords.length})
          </TabsTrigger>
          <TabsTrigger value="invalid" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Com Erros ({invalidRecords.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valid" className="border rounded-lg max-h-96 overflow-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Linha</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Recomendante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validRecords.slice(0, 100).map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row._rowIndex}</TableCell>
                  <TableCell>{row.nome || "-"}</TableCell>
                  <TableCell>{row.telefone || "-"}</TableCell>
                  <TableCell>{row.email || "-"}</TableCell>
                  <TableCell>{row.recomendante || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="invalid" className="border rounded-lg max-h-96 overflow-auto mt-4">
          {invalidRecords.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>Nenhum registro com erro de validação!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Linha</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invalidRecords.slice(0, 100).map((row, index) => (
                  <TableRow key={index} className="bg-red-50 dark:bg-red-950/20">
                    <TableCell>{row._rowIndex}</TableCell>
                    <TableCell>{row.nome || "-"}</TableCell>
                    <TableCell>{row.telefone || "-"}</TableCell>
                    <TableCell>
                      <span className="text-red-600 dark:text-red-400 text-sm">
                        {row._errors?.join(', ') || "Erro"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {validatedData.length > 100 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando apenas os primeiros 100 registros de cada categoria.
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