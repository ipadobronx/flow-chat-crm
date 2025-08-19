import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SitPlanLeadsTable } from "@/components/sitplan/SitPlanLeadsTable";
import { TALeadsCard } from "@/components/sitplan/TALeadsCard";
import { SelecionadosCard } from "@/components/sitplan/SelecionadosCard";
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { useState } from "react";

export default function SitPlan() {
  const [dragEndEvent, setDragEndEvent] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (event: DragStartEvent) => {
    console.log('🎯 SitPlan: Drag iniciado:', event);
    setIsDragging(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Log apenas se estiver sobre uma drop zone
    if (event.over?.id === "ta-leads") {
      console.log('🎯 SitPlan: Drag sobre a zona TA');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('🎯 SitPlan: Drag end detectado no nível da página:', event);
    setDragEndEvent(event);
    setIsDragging(false);
    
    // Passar o evento para o SelecionadosCard se necessário
    if (event.active?.data?.current?.type === "sitplan-lead") {
      console.log('🎯 SitPlan: Lead sendo arrastado, passando para SelecionadosCard');
      
      // Chamar a função do SelecionadosCard
      if ((window as any).processDragEnd) {
        (window as any).processDragEnd(event);
      }
    }
  };

  return (
    <DashboardLayout>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={`p-6 space-y-6 transition-all duration-300 ${
          isDragging ? 'bg-gradient-to-br from-blue-50/30 to-purple-50/30' : ''
        }`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-3xl font-bold tracking-tight transition-all duration-300 ${
              isDragging ? 'text-blue-600 scale-105' : ''
            }`}>
              SIT PLAN
            </h1>
          </div>
          
          {/* Grid com duas tabelas lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card de leads selecionados para o próximo SitPlan */}
            <SelecionadosCard />
            
            {/* Card de leads selecionados para TA */}
            <TALeadsCard />
          </div>
          
          {/* Card principal com scroll limitado */}
          <div className="max-h-[60vh] overflow-auto">
            <SitPlanLeadsTable />
          </div>
        </div>
      </DndContext>
    </DashboardLayout>
  );
}