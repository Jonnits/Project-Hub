"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AppWindow } from "lucide-react";

import { useStandalone } from "@/hooks/use-standalone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function browserKind() {
  if (typeof navigator === "undefined") return "other" as const;
  const ua = navigator.userAgent;
  const isSafari = /safari/i.test(ua) && !/chrome|chromium|android/i.test(ua);
  const isMac = /mac/i.test(navigator.platform) || /mac os/i.test(ua);
  if (isSafari && isMac) return "safari-mac" as const;
  if (isSafari) return "safari-ios" as const;
  if (/chrome|edg|chromium/i.test(ua)) return "chrome" as const;
  return "other" as const;
}

export function AddToDock({ compact = false }: { compact?: boolean }) {
  const standalone = useStandalone();
  const [open, setOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const kind = useSyncExternalStore(
    () => () => {},
    browserKind,
    () => "other" as const
  );

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone) return null;

  async function installFromChrome() {
    if (!installEvent) {
      setOpen(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstallEvent(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "sm" : "sm"}
        className={compact ? undefined : "w-full justify-start text-muted-foreground"}
        onClick={() => {
          if (installEvent) void installFromChrome();
          else setOpen(true);
        }}
      >
        <AppWindow />
        Add to Dock
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Project Hub to the Dock</DialogTitle>
            <DialogDescription>
              The board opens in its own window. Keep the local server running so the window has something to load.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            {kind === "safari-mac" ? (
              <p>
                In Safari: <span className="font-medium text-foreground">File → Add to Dock</span>.
                Project Hub appears next to your other apps. Open it from the Dock like any Mac app.
              </p>
            ) : kind === "chrome" ? (
              <p>
                In Chrome, use the install icon in the address bar, or the button below if Chrome offers it.
                After it installs, you can keep it in the Dock.
              </p>
            ) : kind === "safari-ios" ? (
              <p>
                Share → <span className="font-medium text-foreground">Add to Home Screen</span>.
              </p>
            ) : (
              <p>
                Safari on a Mac: <span className="font-medium text-foreground">File → Add to Dock</span>.
                Chrome: install from the address bar, then keep the app in the Dock.
              </p>
            )}
            <p className="text-muted-foreground">
              Prefer a production window: <span className="font-mono text-xs">npm run build</span> then{" "}
              <span className="font-mono text-xs">npm start -- --hostname 127.0.0.1 --port 43127</span>, then add that
              URL.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            {installEvent ? (
              <Button type="button" onClick={() => void installFromChrome()}>
                Install
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
