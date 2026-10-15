"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiLogin } from "@/lib/api";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { useBoardStore } from "@/lib/store";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const hydrate = useBoardStore((state) => state.hydrate);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event?: React.FormEvent, override?: { email: string; password: string }) {
    event?.preventDefault();
    const nextEmail = override?.email ?? email;
    const nextPassword = override?.password ?? password;
    setPending(true);
    setError(null);
    try {
      const user = await apiLogin({ email: nextEmail, password: nextPassword });
      await hydrate(user);
      router.replace(next.startsWith("/") ? next : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">Email</span>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@studio.local"
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">Password</span>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link className="text-foreground underline-offset-4 hover:underline" href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}>
          Create an account
        </Link>
        . Share links still require registration before they open a board.
      </p>
      <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
        <p className="text-xs font-medium text-muted-foreground">Demo team (password `{DEMO_PASSWORD}`)</p>
        <div className="mt-2 grid gap-1">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.id}
              type="button"
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-background"
              onClick={() => {
                setEmail(account.email);
                setPassword(DEMO_PASSWORD);
                void submit(undefined, { email: account.email, password: DEMO_PASSWORD });
              }}
            >
              <span>{account.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{account.email}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Maya, Jordan, Sam, and Riley already share the sample boards. A new account starts empty until you create a project or open an invite.
        </p>
      </div>
    </form>
  );
}
