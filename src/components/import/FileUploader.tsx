import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react";
import { ImportedData, FieldMapping } from "@/pages/ImportLeads";
import { generateFieldMappings, generateTemplateData, FIELD_MAPPINGS } from "@/lib/importUtils";

interface FileUploaderProps {
  onFileUploaded: (data: ImportedData, mappings: FieldMapping[]) => void;
}

export function FileUploader({ onFileUploaded }: FileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const downloadTemplate = useCallback(() => {
    const { headers, examples } = generateTemplateData();
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Dados principais
    const wsData = [headers, ...examples];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Ajustar largura das colunas
    const colWidths = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...examples.map(row => String(row[i] || '').length)
      );
      return { wch: Math.min(maxLen + 2, 30) };
    });
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    
    // Criar planilha de instruções
    const instructionsData = [
      ['Campo', 'Descrição', 'Obrigatório', 'Tipo de Dado', 'Exemplo'],
      ...Object.entries(FIELD_MAPPINGS).map(([field, config]) => [
        field,
        config.description,
        config.required ? 'Sim' : 'Não',
        config.dataType,
        config.synonyms[0]
      ])
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instruções");
    
    // Download
    XLSX.writeFile(wb, "modelo_importacao_leads.xlsx");
  }, []);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      setProgress(25);
      
      const arrayBuffer = await file.arrayBuffer();
      setProgress(50);
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      setProgress(75);
      
      // Converter para JSON preservando a estrutura original
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: true // Preserva os dados originais sem interpretação automática
      });
      
      if (jsonData.length < 2) {
        throw new Error("A planilha deve conter pelo menos um cabeçalho e uma linha de dados");
      }
      
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      // Filtrar linhas vazias
      const filteredRows = rows.filter(row => 
        row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );
      
      const importedData: ImportedData = { headers, rows: filteredRows };
      
      // Gerar mapeamentos automaticamente com sample data
      const mappings = generateFieldMappings(headers, filteredRows.slice(0, 10));
      
      setProgress(100);
      setSuccess(`Arquivo processado com sucesso! ${filteredRows.length} registros encontrados.`);
      
      setTimeout(() => {
        onFileUploaded(importedData, mappings);
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido ao processar o arquivo");
    } finally {
      setIsProcessing(false);
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div className="space-y-4">
      {/* Botão de download do modelo */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={downloadTemplate}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Baixar Planilha Modelo
        </Button>
      </div>

      <Card 
        {...getRootProps()} 
        className={`p-8 border-2 border-dashed cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isProcessing ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10">
            {isProcessing ? (
              <FileSpreadsheet className="w-8 h-8 text-primary animate-pulse" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">
              {isProcessing ? "Processando arquivo..." : "Faça upload da sua planilha"}
            </h3>
            <p className="text-muted-foreground mt-2">
              {isDragActive
                ? "Solte o arquivo aqui"
                : "Arraste e solte ou clique para selecionar"
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Suporta arquivos .xlsx, .xls e .csv (máx. 10MB)
            </p>
          </div>
          
          {!isProcessing && (
            <Button variant="outline">
              Selecionar Arquivo
            </Button>
          )}
        </div>
      </Card>

      {acceptedFiles.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <strong>Arquivo selecionado:</strong> {acceptedFiles[0].name} ({(acceptedFiles[0].size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {progress < 25 && "Lendo arquivo..."}
            {progress >= 25 && progress < 50 && "Processando dados..."}
            {progress >= 50 && progress < 75 && "Analisando estrutura..."}
            {progress >= 75 && progress < 100 && "Mapeando campos..."}
            {progress === 100 && "Concluído!"}
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Dicas para melhor importação:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use a <strong>planilha modelo</strong> para garantir compatibilidade</li>
          <li>Use nomes de colunas claros (ex: "Nome", "Telefone", "Email")</li>
          <li>Mantenha dados consistentes em cada coluna</li>
          <li>Evite células mescladas e formatação complexa</li>
          <li>A primeira linha deve conter os cabeçalhos das colunas</li>
          <li>Campos como "Criado Por", "_RowNumber" serão ignorados automaticamente</li>
        </ul>
      </div>
    </div>
  );
}
