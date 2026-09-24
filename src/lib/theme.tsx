"use client";

import { createContext, useContext, useState } from "react";

import { useIsClient } from "@/hooks/use-is-client";

export type Appearance = "day" | "night";

const STORAGE_KEY = "project-hub-appearance";
const LEGACY_STORAGE_KEY = "forge-appearance";

function readAppearance(): Appearance {
  try {
    const stored =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored === "day" ? "day" : "night";
  } catch {
    return "night";
  }
}

function applyAppearance(appearance: Appearance) {
  document.documentElement.classList.toggle("dark", appearance === "night");
}

const ThemeContext = createContext<{
  appearance: Appearance;
  setAppearance: (value: Appearance) => void;
}>({
  appearance: "night",
  setAppearance: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  const [, setTick] = useState(0);
  const appearance = isClient ? readAppearance() : "night";

  function setAppearance(value: Appearance) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore private-mode storage failures.
    }
    applyAppearance(value);
    setTick((tick) => tick + 1);
  }

  return (
    <ThemeContext.Provider value={{ appearance, setAppearance }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppearance() {
  return useContext(ThemeContext);
}
