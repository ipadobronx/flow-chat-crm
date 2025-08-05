import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { ImportedData, FieldMapping } from "@/pages/ImportLeads";
import { FIELD_MAPPINGS, validateImportedData } from "@/lib/importUtils";

interface FieldMapperProps {
  data: ImportedData;
  initialMappings: FieldMapping[];
  onMappingConfirmed: (mappings: FieldMapping[]) => void;
  onBack: () => void;
}

export function FieldMapper({ data, initialMappings, onMappingConfirmed, onBack }: FieldMapperProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(initialMappings);
  const [validation, setValidation] = useState<{ errors: string[]; warnings: string[] }>({ errors: [], warnings: [] });

  useEffect(() => {
    const validationResult = validateImportedData(data.rows.slice(0, 5), mappings);
    setValidation(validationResult);
  }, [mappings, data.rows]);

  const handleMappingChange = (index: number, targetField: string) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      targetField,
      confidence: targetField ? 0.9 : 0
    };
    setMappings(newMappings);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "Alta";
    if (confidence >= 0.6) return "Média";
    if (confidence > 0) return "Baixa";
    return "Nenhuma";
  };

  const getAvailableFields = () => {
    const usedFields = mappings.filter(m => m.targetField).map(m => m.targetField);
    return Object.keys(FIELD_MAPPINGS).filter(field => !usedFields.includes(field));
  };

  const canProceed = validation.errors.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mapeamento de Campos</h3>
          <p className="text-muted-foreground">
            Confirme ou ajuste como os campos da planilha serão importados
          </p>
        </div>
      </div>

      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coluna da Planilha</TableHead>
              <TableHead>Exemplos</TableHead>
              <TableHead>Campo de Destino</TableHead>
              <TableHead>Confiança</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping, index) => {
              const examples = data.rows
                .slice(0, 3)
                .map(row => row[index])
                .filter(value => value !== null && value !== undefined && value !== '')
                .slice(0, 2);

              const availableFields = [...getAvailableFields(), mapping.targetField].filter(Boolean);

              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {mapping.sourceColumn}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {examples.length > 0 ? examples.join(', ') : 'Sem dados'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping.targetField}
                      onValueChange={(value) => handleMappingChange(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar campo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Não mapear</SelectItem>
                        {availableFields.map((field) => {
                          const fieldConfig = FIELD_MAPPINGS[field as keyof typeof FIELD_MAPPINGS];
                          return (
                            <SelectItem key={field} value={field}>
                              {field}
                              {fieldConfig?.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {mapping.targetField && (
                      <Badge className={getConfidenceColor(mapping.confidence)}>
                        {getConfidenceText(mapping.confidence)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        <p><span className="text-red-500">*</span> Campos obrigatórios</p>
        <p>Total de registros a serem importados: <strong>{data.rows.length}</strong></p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <Button 
          onClick={() => onMappingConfirmed(mappings)}
          disabled={!canProceed}
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}