import React from "react";
import { cn } from "@/lib/utils";

export type CheckedSwitchProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
};

const CheckedSwitch = React.forwardRef<HTMLButtonElement, CheckedSwitchProps>(
  ({ checked, onChange, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black/40",
          checked
            ? "bg-black/70 border-black/50 hover:bg-black"
            : "bg-white/40 border-black/20 hover:bg-white/50 shadow-sm",
          className
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    );
  }
);

export default CheckedSwitch;