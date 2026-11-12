"use client";

import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .catch(() => undefined);
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return (
    <ThemeProvider>
      <TooltipProvider delay={250}>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
