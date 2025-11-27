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
import { useIsTablet } from "@/hooks/use-tablet";
import { cn } from "@/lib/utils";

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
  const { isTablet } = useIsTablet();
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

  // Tablet liquid glass classes
  const cardClasses = cn(
    "rounded-[20px]",
    isTablet && "bg-white/5 backdrop-blur-md border-white/10"
  );

  const titleClasses = cn(isTablet && "text-white");
  const subtitleClasses = cn(isTablet ? "text-white/50" : "text-muted-foreground");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className={cn("text-2xl font-inter font-light tracking-tighter", isTablet ? "text-white" : "text-foreground")}>
            Configurações
          </h1>
          <p className={subtitleClasses}>
            Gerencie as configurações do sistema
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Import Leads Card */}
          <Card className={cn(cardClasses, !isTablet && "border-border/30 bg-card/50 backdrop-blur-sm")}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2 text-lg", titleClasses)}>
                <FileSpreadsheet className={cn("h-5 w-5", isTablet ? "text-[#d4ff4a]" : "text-primary")} />
                Importar Leads
              </CardTitle>
              <CardDescription className={subtitleClasses}>
                Importe leads a partir de planilhas Excel ou CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isImportOpen} onOpenChange={(open) => {
                setIsImportOpen(open);
                if (!open) resetImport();
              }}>
                <DialogTrigger asChild>
                  <Button className={cn(
                    "w-full gap-2",
                    isTablet && "bg-[#d4ff4a] text-black hover:bg-[#c9f035]"
                  )}>
                    <Upload className="h-4 w-4" />
                    Importar Planilha
                  </Button>
                </DialogTrigger>
                <DialogContent className={cn(
                  "max-w-4xl max-h-[90vh] overflow-y-auto",
                  isTablet && "bg-black/80 backdrop-blur-xl border-white/20"
                )}>
                  <DialogHeader>
                    <DialogTitle className={cn("flex items-center gap-2", titleClasses)}>
                      <FileSpreadsheet className="h-5 w-5" />
                      Importar Leads
                    </DialogTitle>
                    <DialogDescription className={subtitleClasses}>
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
          <Card className={cn(cardClasses, !isTablet && "border-border/30 bg-card/50 backdrop-blur-sm")}>
            <CardHeader>
              <CardTitle className={cn("text-lg", titleClasses)}>Em Breve</CardTitle>
              <CardDescription className={subtitleClasses}>
                Mais configurações serão adicionadas em breve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={cn("text-sm", subtitleClasses)}>
                Novas funcionalidades de configuração estão sendo desenvolvidas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}