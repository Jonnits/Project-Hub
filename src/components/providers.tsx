"use client";

import { useEffect, useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsClient } from "@/hooks/use-is-client";
import { ThemeProvider } from "@/lib/theme";
import { useBoardStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setReady(true);
    };
    const timer = window.setTimeout(finish, 800);
    const persist = useBoardStore.persist;

    if (persist?.rehydrate) {
      void Promise.resolve(persist.rehydrate())
        .catch(() => undefined)
        .finally(() => {
          window.clearTimeout(timer);
          finish();
        });
    } else {
      window.clearTimeout(timer);
      finish();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!isClient || !ready) {
    return (
      <div className="flex min-h-dvh bg-background">
        <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-sidebar md:block" />
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <TooltipProvider delay={250}>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
