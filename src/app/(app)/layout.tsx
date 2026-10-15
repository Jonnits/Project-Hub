import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh bg-background">
          <aside className="hidden w-60 shrink-0 border-r border-border/80 bg-sidebar md:block" />
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading workspace…
          </div>
        </div>
      }
    >
      <AuthGate>
        <AppShell>{children}</AppShell>
      </AuthGate>
    </Suspense>
  );
}
