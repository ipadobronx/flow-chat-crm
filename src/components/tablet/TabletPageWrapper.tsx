import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TabletPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function TabletPageWrapper({ children, className }: TabletPageWrapperProps) {
  return (
    <AuroraBackground className="flex flex-col">
      {/* Back button header */}
      <header className="flex items-center gap-4 px-4 py-4">
        <Link 
          to="/"
          className={cn(
            "group flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-white/5 backdrop-blur-xl border border-white/10",
            "transition-all duration-300",
            "hover:bg-white/10 hover:border-white/20",
            "active:scale-95"
          )}
        >
          <ArrowLeft className="h-4 w-4 text-white/70 transition-colors group-hover:text-white" />
          <span className="text-sm font-inter text-white/70 group-hover:text-white">
            Voltar ao Menu
          </span>
        </Link>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <div className={cn(
          "mx-auto p-4 animate-fade-in",
          "rounded-t-[20px]",
          "min-h-[calc(100vh-80px)]",
          className
        )}>
          {children}
        </div>
      </main>
    </AuroraBackground>
  );
}
