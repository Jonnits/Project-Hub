"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { apiCreateShare } from "@/lib/api";
import { useBoardStore } from "@/lib/store";
import type { ShareKind } from "@/lib/types";

async function copyShareLink(kind: ShareKind, targetId: string) {
  const token = await apiCreateShare(kind, targetId);
  const url = `${window.location.origin}/join/${token}`;
  await navigator.clipboard.writeText(url);
  return url;
}

export function ShareMenuItem({
  kind,
  targetId,
  children,
}: {
  kind: ShareKind;
  targetId: string;
  children: string;
}) {
  const [label, setLabel] = useState(children);
  async function handleClick() {
    if (!navigator.onLine) {
      setLabel("Connect to share");
      window.setTimeout(() => setLabel(children), 1800);
      return;
    }
    try {
      await copyShareLink(kind, targetId);
      setLabel("Link copied");
      window.setTimeout(() => setLabel(children), 1800);
    } catch {
      setLabel("Could not copy link");
      window.setTimeout(() => setLabel(children), 1800);
    }
  }
  return <DropdownMenuItem onClick={() => void handleClick()}>{label}</DropdownMenuItem>;
}

export function ShareIssueButton({ issueId }: { issueId: string }) {
  const [label, setLabel] = useState("Copy issue link");
  const syncStatus = useBoardStore((state) => state.syncStatus);

  async function handleClick() {
    if (!navigator.onLine || syncStatus === "offline") {
      setLabel("Connect to share");
      window.setTimeout(() => setLabel("Copy issue link"), 1800);
      return;
    }
    try {
      await copyShareLink("issue", issueId);
      setLabel("Link copied");
      window.setTimeout(() => setLabel("Copy issue link"), 1800);
    } catch {
      setLabel("Could not copy link");
      window.setTimeout(() => setLabel("Copy issue link"), 1800);
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={() => void handleClick()}>
      <Link2 />
      {label}
    </Button>
  );
}
