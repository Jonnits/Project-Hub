"use client";

import { useSyncExternalStore } from "react";

function readStandalone() {
  if (typeof window === "undefined") return false;
  const media =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches;
  const safari = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || safari;
}

function subscribe(onStoreChange: () => void) {
  const standalone = window.matchMedia("(display-mode: standalone)");
  const overlay = window.matchMedia("(display-mode: window-controls-overlay)");
  standalone.addEventListener("change", onStoreChange);
  overlay.addEventListener("change", onStoreChange);
  return () => {
    standalone.removeEventListener("change", onStoreChange);
    overlay.removeEventListener("change", onStoreChange);
  };
}

export function useStandalone() {
  return useSyncExternalStore(subscribe, readStandalone, () => false);
}
