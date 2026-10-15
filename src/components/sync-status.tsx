"use client";

import { Cloud, CloudOff, LoaderCircle, RefreshCw } from "lucide-react";

import { useBoardStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const COPY: Record<string, string> = {
  offline: "Offline — changes queue here",
  pending: "Waiting to sync",
  syncing: "Syncing…",
  saved: "Saved to this machine and the server",
  error: "Could not sync — will retry",
};

export function SyncStatus() {
  const status = useBoardStore((state) => state.syncStatus);
  const pending = useBoardStore((state) => state.outbox.length);
  const error = useBoardStore((state) => state.error);
  const flush = useBoardStore((state) => state.flush);

  const label =
    status === "pending" && pending > 0
      ? `${pending} change${pending === 1 ? "" : "s"} waiting to sync`
      : error && status === "error"
        ? error
        : COPY[status];

  const Icon =
    status === "offline"
      ? CloudOff
      : status === "syncing"
        ? LoaderCircle
        : status === "error"
          ? RefreshCw
          : Cloud;

  return (
    <button
      type="button"
      onClick={() => void flush()}
      className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      title="Retry sync"
    >
      <Icon
        className={cn("mt-0.5 size-3.5 shrink-0", status === "syncing" && "animate-spin")}
      />
      <span>{label}</span>
    </button>
  );
}
