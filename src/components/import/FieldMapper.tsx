import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, HelpCircle, Check } from "lucide-react";
import { ImportedData, FieldMapping } from "@/pages/ImportLeads";
import { FIELD_MAPPINGS, FIELD_CATEGORIES, validateImportedData, shouldIgnoreColumn } from "@/lib/importUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    const actualField = targetField === "__none__" ? "" : targetField;
    newMappings[index] = {
      ...newMappings[index],
      targetField: actualField,
      confidence: actualField ? 0.9 : 0
    };
    setMappings(newMappings);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "Alta";
    if (confidence >= 0.6) return "Média";
    if (confidence > 0) return "Baixa";
    return "Nenhuma";
  };

  // Retorna todos os campos agrupados por categoria
  const getFieldsByCategory = () => {
    const usedFields = mappings.filter(m => m.targetField).map(m => m.targetField);
    const result: Record<string, { field: string; isUsed: boolean; description: string; required: boolean }[]> = {};
    
    Object.entries(FIELD_CATEGORIES).forEach(([category, fields]) => {
      result[category] = fields.map(field => ({
        field,
        isUsed: usedFields.includes(field),
        description: FIELD_MAPPINGS[field]?.description || field,
        required: FIELD_MAPPINGS[field]?.required || false
      }));
    });
    
    return result;
  };

  const isColumnIgnored = (sourceColumn: string) => shouldIgnoreColumn(sourceColumn);

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

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Coluna da Planilha</TableHead>
              <TableHead className="w-[200px]">Exemplos</TableHead>
              <TableHead className="w-[250px]">Campo de Destino</TableHead>
              <TableHead className="w-[100px]">Confiança</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping, index) => {
              const examples = data.rows
                .slice(0, 3)
                .map(row => row[index])
                .filter(value => value !== null && value !== undefined && value !== '')
                .slice(0, 2);

              const fieldsByCategory = getFieldsByCategory();
              const isIgnored = isColumnIgnored(mapping.sourceColumn);

              return (
                <TableRow 
                  key={index} 
                  className={isIgnored && !mapping.targetField ? "opacity-50 bg-muted/30" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {mapping.sourceColumn}
                      {isIgnored && !mapping.targetField && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="text-xs">Auto-ignorado</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Campo identificado como metadata do sistema</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {examples.length > 0 ? examples.join(', ') : 'Sem dados'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping.targetField || "__none__"}
                      onValueChange={(value) => handleMappingChange(index, value)}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Selecionar campo..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] bg-background z-50">
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">Não mapear</span>
                        </SelectItem>
                        
                        {Object.entries(fieldsByCategory).map(([category, fields]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                              {category}
                            </div>
                            {fields.map(({ field, isUsed, description, required }) => (
                              <SelectItem 
                                key={field} 
                                value={field}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  {isUsed && mapping.targetField !== field && (
                                    <Check className="w-3 h-3 text-muted-foreground" />
                                  )}
                                  <span className={isUsed && mapping.targetField !== field ? "text-muted-foreground" : ""}>
                                    {field}
                                  </span>
                                  {required && (
                                    <span className="text-destructive">*</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
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

      <div className="text-sm text-muted-foreground space-y-1">
        <p><span className="text-destructive">*</span> Campos obrigatórios</p>
        <p><Check className="w-3 h-3 inline text-muted-foreground" /> Campo já mapeado em outra coluna (pode reutilizar se necessário)</p>
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
