import React from "react";
import { cn } from "@/lib/utils";

export interface LiquidGlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "light";
}

const LiquidGlassInput = React.forwardRef<HTMLInputElement, LiquidGlassInputProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-2xl border border-border/40 dark:border-white/30 bg-border/10 dark:bg-white/10 backdrop-blur-md px-3 py-2 text-sm font-inter tracking-tighter shadow-md focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:bg-border/15 dark:hover:bg-white/15",
          variant === "light" 
            ? "text-white placeholder:text-white/50 focus-visible:ring-white/50" 
            : "text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus-visible:ring-black/50 dark:focus-visible:ring-white/50",
          className
        )}
        {...props}
      />
    );
  }
);

export { LiquidGlassInput };
export default LiquidGlassInput;