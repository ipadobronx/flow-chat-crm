import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface LiquidGlassIconButtonProps {
  icon: LucideIcon;
  to: string;
  label?: string;
  className?: string;
}

export function LiquidGlassIconButton({ 
  icon: Icon, 
  to, 
  label,
  className 
}: LiquidGlassIconButtonProps) {
  return (
    <Link 
      to={to}
      aria-label={label}
      className={cn(
        "group relative flex items-center justify-center",
        "h-12 w-12 rounded-full",
        "bg-white/5 backdrop-blur-xl",
        "border border-white/10",
        "transition-all duration-300 ease-out",
        "hover:scale-110 hover:bg-white/15",
        "hover:border-white/25 hover:shadow-lg hover:shadow-white/10",
        "active:scale-95",
        className
      )}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(ellipse at center, hsl(0 0% 100% / 0.1) 0%, transparent 70%)",
        }}
      />
      
      <Icon className="h-5 w-5 text-white/70 transition-all duration-300 group-hover:text-white" strokeWidth={1.5} />
    </Link>
  );
}
