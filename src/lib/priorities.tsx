import {
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  Equal,
  Minus,
} from "lucide-react";

import type { Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

export const PRIORITIES: Priority[] = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
];

export function priorityLabel(priority: Priority) {
  switch (priority) {
    case "urgent":
      return "Urgent";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "No priority";
  }
}

export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const cls = cn("size-3.5", className);
  switch (priority) {
    case "urgent":
      return <ChevronsUp className={cn(cls, "text-orange-500")} />;
    case "high":
      return <ChevronUp className={cn(cls, "text-rose-500")} />;
    case "medium":
      return <Equal className={cn(cls, "text-amber-400")} />;
    case "low":
      return <ChevronDown className={cn(cls, "text-sky-400")} />;
    default:
      return <Minus className={cn(cls, "text-muted-foreground")} />;
  }
}
