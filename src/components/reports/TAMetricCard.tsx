import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TAMetricCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  gradient?: string;
}

export function TAMetricCard({
  title,
  value,
  icon,
  isActive = false,
  onClick,
  gradient = "bg-gradient-primary"
}: TAMetricCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-elegant transform hover:scale-105",
        isActive && "ring-2 ring-primary shadow-elegant scale-105"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className={cn("p-6 text-white", gradient)}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium opacity-90">{title}</p>
              <p className="text-3xl font-bold">{value.toLocaleString('pt-BR')}</p>
            </div>
            {icon && (
              <div className="text-white/80">
                {icon}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}