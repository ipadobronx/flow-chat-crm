import React from "react";

export function GlassProgressBar({ progress = 75 }: { progress?: number }) {
  return (
    <div className="w-full bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-2xl h-3 border border-border/30 dark:border-white/20 shadow-xl overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-black/30 via-black/60 to-black/80 dark:from-white/40 dark:via-white/60 dark:to-white/80 rounded-2xl animate-gradient-shift bg-[length:400%_400%] shadow-lg shadow-black/30 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default GlassProgressBar;