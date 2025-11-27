import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface LiquidGlassActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label?: string;
  variant?: "default" | "electric";
  size?: "sm" | "md";
}

export function LiquidGlassActionButton({ 
  icon: Icon, 
  label,
  variant = "default",
  size = "md",
  className,
  disabled,
  ...props
}: LiquidGlassActionButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "group relative flex items-center justify-center rounded-full transition-all duration-300 ease-out",
        "active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-10 w-10 sm:h-12 sm:w-12",
        variant === "default" && [
          "bg-white/5 backdrop-blur-xl border border-white/10",
          "hover:scale-110 hover:bg-white/15 hover:border-white/25",
          "hover:shadow-lg hover:shadow-white/10",
        ],
        variant === "electric" && [
          "bg-[#d4ff4a] border border-[#d4ff4a]",
          "hover:scale-110 hover:bg-[#c9f035]",
          "hover:shadow-lg hover:shadow-[#d4ff4a]/30",
        ],
        className
      )}
      {...props}
    >
      {/* Glow effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        variant === "default" && "bg-[radial-gradient(ellipse_at_center,_hsl(0_0%_100%_/_0.1)_0%,_transparent_70%)]",
        variant === "electric" && "bg-[radial-gradient(ellipse_at_center,_hsl(75_100%_65%_/_0.3)_0%,_transparent_70%)]"
      )} />
      
      <Icon 
        className={cn(
          "relative z-10 transition-all duration-300",
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          variant === "default" && "text-white/70 group-hover:text-white",
          variant === "electric" && "text-black"
        )} 
        strokeWidth={1.5} 
      />
    </button>
  );
}
