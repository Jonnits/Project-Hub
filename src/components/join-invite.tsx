"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Box } from "lucide-react";

import { AuthChrome } from "@/components/auth-chrome";
import { Button } from "@/components/ui/button";
import { apiJoinShare, apiMe, apiSharePreview } from "@/lib/api";
import { issueKey } from "@/lib/format";
import { useBoardStore } from "@/lib/store";
import type { SharePreview } from "@/lib/types";

function inviteCopy(preview: SharePreview) {
  if (preview.kind === "issue" && preview.issueNumber != null) {
    return {
      title: `${issueKey(preview.projectKey, preview.issueNumber)} on ${preview.projectName}`,
      body: preview.issueTitle
        ? `You're invited to open “${preview.issueTitle}” on the ${preview.projectName} board.`
        : `You're invited to an issue on ${preview.projectName}.`,
    };
  }
  return {
    title: preview.projectName,
    body: `You're invited to the ${preview.projectName} board (${preview.projectKey}). Register or sign in, then join to get access.`,
  };
}

function destination(preview: SharePreview) {
  const issue = preview.issueId ? `?issue=${preview.issueId}` : "";
  return `/projects/${preview.projectId}${issue}`;
}

export function JoinInvite({ token }: { token: string }) {
  const router = useRouter();
  const hydrate = useBoardStore((state) => state.hydrate);
  const user = useBoardStore((state) => state.user);
  const [preview, setPreview] = useState<SharePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await apiMe().catch(() => user);
        if (!cancelled) setSignedIn(!!me);
        const next = await apiSharePreview(token);
        if (cancelled) return;
        setPreview(next);
        if (me && next.alreadyMember) {
          router.replace(destination(next));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "This invite is not valid.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, router, user]);

  async function join() {
    if (!preview) return;
    setPending(true);
    setError(null);
    try {
      const next = await apiJoinShare(token);
      const me = await apiMe();
      if (me) await hydrate(me);
      router.replace(destination(next));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not join.";
      if (message === "unauthorized") {
        router.push(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
        return;
      }
      setError(message);
    } finally {
      setPending(false);
    }
  }

  if (error && !preview) {
    return (
      <AuthChrome title="Invite not found" subtitle="This share link is expired, revoked, or was typed incorrectly.">
        <Button type="button" onClick={() => router.push("/")}>
          Back to Project Hub
        </Button>
      </AuthChrome>
    );
  }

  if (!preview) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Opening invite…
      </div>
    );
  }

  const copy = inviteCopy(preview);

  return (
    <AuthChrome title={copy.title} subtitle={copy.body}>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {signedIn ? (
        <div className="grid gap-3">
          <Button onClick={() => void join()} disabled={pending}>
            {pending ? "Joining…" : preview.alreadyMember ? "Open board" : "Join board"}
          </Button>
          <p className="text-sm text-muted-foreground">
            You will see this project in the sidebar next to boards you already own.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <Button type="button" onClick={() => router.push(`/register?next=${encodeURIComponent(`/join/${token}`)}`)}>
            Create an account to join
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/login?next=${encodeURIComponent(`/join/${token}`)}`)}
          >
            I already have an account
          </Button>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Box className="size-3.5" />
            Invites never open a board until you are signed in.
          </p>
        </div>
      )}
    </AuthChrome>
  );
}
