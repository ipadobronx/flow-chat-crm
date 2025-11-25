import React from "react";
import { cn } from "@/lib/utils";

export type LiquidGlassTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const LiquidGlassTextarea = React.forwardRef<HTMLTextAreaElement, LiquidGlassTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-2xl border border-border/40 dark:border-white/30 bg-border/10 dark:bg-white/10 backdrop-blur-md px-3 py-2 text-sm font-inter tracking-tighter text-foreground placeholder:text-muted-foreground shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:bg-border/15 dark:hover:bg-white/15 resize-none",
          className
        )}
        {...props}
      />
    );
  }
);

export { LiquidGlassTextarea };
export default LiquidGlassTextarea;