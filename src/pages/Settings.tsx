import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUploader } from "@/components/import/FileUploader";
import { FieldMapper } from "@/components/import/FieldMapper";
import { ImportPreview } from "@/components/import/ImportPreview";
import { toast } from "sonner";

interface ImportedData {
  headers: string[];
  rows: any[][];
}

interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

export default function Settings() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const handleFileUploaded = (data: ImportedData, mappings: FieldMapping[]) => {
    setImportedData(data);
    setFieldMappings(mappings);
    setCurrentStep('mapping');
  };

  const handleMappingConfirmed = (mappings: FieldMapping[]) => {
    setFieldMappings(mappings);
    setCurrentStep('preview');
  };

  const handleImportComplete = () => {
    toast.success("Leads importados com sucesso!");
    resetImport();
    setIsImportOpen(false);
  };

  const resetImport = () => {
    setImportedData(null);
    setFieldMappings([]);
    setCurrentStep('upload');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-inter font-light tracking-tighter text-foreground">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Import Leads Card */}
          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Importar Leads
              </CardTitle>
              <CardDescription>
                Importe leads a partir de planilhas Excel ou CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isImportOpen} onOpenChange={(open) => {
                setIsImportOpen(open);
                if (!open) resetImport();
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2">
                    <Upload className="h-4 w-4" />
                    Importar Planilha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Importar Leads
                    </DialogTitle>
                    <DialogDescription>
                      {currentStep === 'upload' && "Selecione um arquivo Excel ou CSV para importar"}
                      {currentStep === 'mapping' && "Mapeie as colunas da planilha para os campos do sistema"}
                      {currentStep === 'preview' && "Revise os dados antes de confirmar a importação"}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4">
                    {currentStep === 'upload' && (
                      <FileUploader onFileUploaded={handleFileUploaded} />
                    )}
                    
                    {currentStep === 'mapping' && importedData && (
                      <FieldMapper
                        data={importedData}
                        initialMappings={fieldMappings}
                        onMappingConfirmed={handleMappingConfirmed}
                        onBack={() => setCurrentStep('upload')}
                      />
                    )}
                    
                    {currentStep === 'preview' && importedData && (
                      <ImportPreview
                        data={importedData}
                        mappings={fieldMappings}
                        onImportComplete={handleImportComplete}
                        onBack={() => setCurrentStep('mapping')}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Placeholder for other settings */}
          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Em Breve</CardTitle>
              <CardDescription>
                Mais configurações serão adicionadas em breve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Novas funcionalidades de configuração estão sendo desenvolvidas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
