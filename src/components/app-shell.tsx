"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Box, Menu, Plus, RotateCcw } from "lucide-react";

import { CreateProjectDialog } from "@/components/create-project-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useBoardStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function ProjectNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const projects = useBoardStore((state) => state.projects);
  const issues = useBoardStore((state) => state.issues);

  return (
    <nav className="flex flex-col gap-0.5">
      {projects.map((project) => {
        const href = `/projects/${project.id}`;
        const active = pathname === href;
        const openCount = issues.filter(
          (issue) =>
            issue.projectId === project.id &&
            issue.status !== project.columns[project.columns.length - 1]?.id
        ).length;
        return (
          <Link
            key={project.id}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <span
              className="size-2 rounded-[3px]"
              style={{ backgroundColor: project.color }}
            />
            <span className="min-w-0 flex-1 truncate font-heading">{project.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground/80">
              {openCount}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const resetDemo = useBoardStore((state) => state.resetDemo);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="flex h-14 items-center gap-2 px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 font-heading text-xl tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Box className="size-4" />
          </span>
          Project Hub
        </Link>
      </div>
      <div className="flex items-center justify-between px-3 pb-2">
        <p className="font-heading px-1 text-[11px] tracking-wide text-muted-foreground uppercase">
          Projects
        </p>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => setCreateOpen(true)}
          aria-label="New project"
        >
          <Plus />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <ProjectNav onNavigate={onNavigate} />
      </div>
      <Separator />
      <ThemeToggle />
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => {
            resetDemo();
            onNavigate?.();
            router.push("/");
          }}
        >
          <RotateCcw />
          Reset demo data
        </Button>
      </div>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/80 bg-sidebar md:flex">
        <SidebarBody />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center gap-2 border-b border-border/80 px-3 md:hidden">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          <Link href="/" className="font-heading flex items-center gap-2 text-lg">
            <Box className="size-4" />
            Project Hub
          </Link>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
