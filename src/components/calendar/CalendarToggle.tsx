import { Calendar, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarViewType = "calendar" | "tasks";

interface CalendarToggleProps {
  activeView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export const CalendarToggle = ({ activeView, onViewChange }: CalendarToggleProps) => {
  return (
    <div className="flex items-center bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10">
      <button
        onClick={() => onViewChange("calendar")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
          activeView === "calendar"
            ? "bg-[#d4ff4a] text-black shadow-lg"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <Calendar className="h-4 w-4" />
        Calendar
      </button>
      <button
        onClick={() => onViewChange("tasks")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
          activeView === "tasks"
            ? "bg-[#d4ff4a] text-black shadow-lg"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <ListTodo className="h-4 w-4" />
        Tasks
      </button>
    </div>
  );
};
