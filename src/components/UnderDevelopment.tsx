import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface UnderDevelopmentProps {
  pageName?: string;
}

export function UnderDevelopment({ pageName = "Esta funcionalidade" }: UnderDevelopmentProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
          <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Construction className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Em Desenvolvimento
            </h2>
            <p className="text-muted-foreground">
              {pageName} está sendo desenvolvida. Em breve estará disponível.
            </p>
          </div>

          <Button 
            onClick={() => navigate('/')}
            className="gap-2"
            variant="default"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}