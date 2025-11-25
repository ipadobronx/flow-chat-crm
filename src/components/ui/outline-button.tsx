import React from "react";
import { cn } from "@/lib/utils";

export type OutlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const OutlineButton = React.forwardRef<HTMLButtonElement, OutlineButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-inter font-normal tracking-tighter h-10 px-4 py-2 bg-transparent backdrop-blur-md border-2 border-white/40 text-foreground shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/60 hover:shadow-2xl hover:shadow-white/10",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

export default OutlineButton;