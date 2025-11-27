import React from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function AuroraBackground({ children, className }: AuroraBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-[#0a0a0a]", className)}>
      {/* Aurora light streaks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Pink/Magenta streak */}
        <div 
          className="absolute -top-40 -left-40 h-[600px] w-[600px] animate-aurora-1 rounded-full opacity-30"
          style={{
            background: "radial-gradient(ellipse at center, hsl(330 100% 60% / 0.4) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        
        {/* Blue streak */}
        <div 
          className="absolute top-20 right-0 h-[500px] w-[500px] animate-aurora-2 rounded-full opacity-25"
          style={{
            background: "radial-gradient(ellipse at center, hsl(220 100% 60% / 0.4) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        
        {/* White/Cyan streak */}
        <div 
          className="absolute bottom-0 left-1/3 h-[400px] w-[400px] animate-aurora-3 rounded-full opacity-20"
          style={{
            background: "radial-gradient(ellipse at center, hsl(190 100% 70% / 0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Diagonal light rays */}
        <div 
          className="absolute top-0 left-1/4 h-full w-[2px] rotate-[25deg] opacity-10"
          style={{
            background: "linear-gradient(to bottom, transparent, hsl(0 0% 100% / 0.3), transparent)",
          }}
        />
        <div 
          className="absolute top-0 left-1/2 h-full w-[1px] rotate-[15deg] opacity-5"
          style={{
            background: "linear-gradient(to bottom, transparent, hsl(330 100% 70% / 0.4), transparent)",
          }}
        />
        <div 
          className="absolute top-0 right-1/4 h-full w-[2px] rotate-[-20deg] opacity-10"
          style={{
            background: "linear-gradient(to bottom, transparent, hsl(220 100% 70% / 0.3), transparent)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
