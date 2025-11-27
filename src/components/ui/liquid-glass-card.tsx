import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface LiquidGlassCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  to: string;
  className?: string;
  delay?: number;
}

export function LiquidGlassCard({ 
  icon: Icon, 
  title, 
  description, 
  to, 
  className,
  delay = 0 
}: LiquidGlassCardProps) {
  return (
    <Link 
      to={to}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3 p-6",
        "min-h-[140px] rounded-[20px]",
        "bg-white/5 backdrop-blur-xl",
        "border border-white/10",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:bg-white/10",
        "hover:border-white/20 hover:shadow-lg hover:shadow-white/5",
        "active:scale-[0.98]",
        "animate-fade-in-up",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards"
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(ellipse at center, hsl(0 0% 100% / 0.05) 0%, transparent 70%)",
        }}
      />
      
      <Icon className="h-12 w-12 text-white/80 transition-all duration-300 group-hover:text-white group-hover:scale-110" strokeWidth={1.5} />
      
      <div className="text-center">
        <h3 className="font-inter text-lg font-medium tracking-tight text-white/90 group-hover:text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
