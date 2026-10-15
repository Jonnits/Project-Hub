"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiMe } from "@/lib/api";
import { readSession } from "@/lib/cache";
import { useBoardStore } from "@/lib/store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useBoardStore((state) => state.user);
  const hydrated = useBoardStore((state) => state.hydrated);
  const hydrate = useBoardStore((state) => state.hydrate);
  const flush = useBoardStore((state) => state.flush);
  const pull = useBoardStore((state) => state.pull);
  const markOffline = useBoardStore((state) => state.markOffline);
  const signOutLocal = useBoardStore((state) => state.signOutLocal);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const cached = readSession();
      const next = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
      try {
        const me = await apiMe();
        if (cancelled) return;
        if (!me) {
          signOutLocal();
          router.replace(`/login?next=${encodeURIComponent(next || "/")}`);
          return;
        }
        await hydrate(me);
      } catch {
        if (cancelled) return;
        if (cached) {
          await hydrate(cached);
          markOffline();
        } else {
          router.replace(`/login?next=${encodeURIComponent(next || "/")}`);
          return;
        }
      } finally {
        if (!cancelled) setChecked(true);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
    // Boot once per app-shell mount. Route changes should not re-auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;
    const timer = window.setInterval(() => {
      if (!navigator.onLine) {
        markOffline();
        return;
      }
      if (useBoardStore.getState().outbox.length) void flush();
      else void pull();
    }, 5000);
    const onOnline = () => {
      void flush();
    };
    const onOffline = () => markOffline();
    const onVisible = () => {
      if (document.visibilityState === "visible") void flush();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [flush, hydrated, markOffline, pull, user]);

  useEffect(() => {
    if (!checked) return;
    if (!user) {
      const next = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(next || "/")}`);
    }
  }, [checked, pathname, router, searchParams, user]);

  if (user && hydrated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border/80 bg-sidebar md:block" />
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading workspace…
      </div>
    </div>
  );
}
