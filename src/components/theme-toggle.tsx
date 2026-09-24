"use client";

import { Moon, Sun } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { useAppearance } from "@/lib/theme";

export function ThemeToggle() {
  const { appearance, setAppearance } = useAppearance();
  const isNight = appearance === "night";

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sun className="size-3.5" />
        <span>Day</span>
      </div>
      <Switch
        checked={isNight}
        onCheckedChange={(checked) => setAppearance(checked ? "night" : "day")}
        aria-label="Night appearance"
      />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Night</span>
        <Moon className="size-3.5" />
      </div>
    </div>
  );
}
