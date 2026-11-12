"use client";

import Link from "next/link";
import { Box } from "lucide-react";

import { AddToDock } from "@/components/add-to-dock";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthChrome({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="font-heading flex items-center gap-2 text-xl tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Box className="size-4" />
          </span>
          Project Hub
        </Link>
        <div className="flex flex-col items-end gap-1">
          <div className="w-52">
            <ThemeToggle />
          </div>
          <AddToDock compact />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md rounded-xl border border-border/80 bg-card p-6 shadow-sm">
          <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
