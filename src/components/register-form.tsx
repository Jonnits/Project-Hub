"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRegister } from "@/lib/api";
import { useBoardStore } from "@/lib/store";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const hydrate = useBoardStore((state) => state.hydrate);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const user = await apiRegister({ name, email, password });
      await hydrate(user);
      router.replace(next.startsWith("/") ? next : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">Name</span>
        <Input
          value={name}
          autoComplete="name"
          onChange={(event) => setName(event.target.value)}
          placeholder="Alex Rivera"
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">Email</span>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="alex@studio.local"
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">Password</span>
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={4}
          required
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="text-foreground underline-offset-4 hover:underline" href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
