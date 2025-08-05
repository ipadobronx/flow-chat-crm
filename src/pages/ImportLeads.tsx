import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FileUploader } from "@/components/import/FileUploader";
import { FieldMapper } from "@/components/import/FieldMapper";
import { ImportPreview } from "@/components/import/ImportPreview";
import { ImportHistory } from "@/components/import/ImportHistory";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, History } from "lucide-react";

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
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'map' | 'preview'>('upload');

  const handleFileUploaded = (data: ImportedData, mappings: FieldMapping[]) => {
    setImportedData(data);
    setFieldMappings(mappings);
    setCurrentStep('map');
  };

  const handleMappingConfirmed = (mappings: FieldMapping[]) => {
    setFieldMappings(mappings);
    setCurrentStep('preview');
  };

  const handleImportComplete = () => {
    setImportedData(null);
    setFieldMappings([]);
    setCurrentStep('upload');
  };

  const resetImport = () => {
    setImportedData(null);
    setFieldMappings([]);
    setCurrentStep('upload');
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Importar Leads</h2>
        </div>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card className="p-6">
              {currentStep === 'upload' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Upload de Planilha</h3>
                  </div>
                  <FileUploader onFileUploaded={handleFileUploaded} />
                </div>
              )}

              {currentStep === 'map' && importedData && (
                <FieldMapper
                  data={importedData}
                  initialMappings={fieldMappings}
                  onMappingConfirmed={handleMappingConfirmed}
                  onBack={resetImport}
                />
              )}

              {currentStep === 'preview' && importedData && (
                <ImportPreview
                  data={importedData}
                  mappings={fieldMappings}
                  onImportComplete={handleImportComplete}
                  onBack={() => setCurrentStep('map')}
                />
              )}
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <ImportHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}