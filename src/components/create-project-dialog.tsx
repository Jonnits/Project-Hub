"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { keyFromName } from "@/lib/format";
import { PROJECT_COLORS } from "@/lib/seed";
import { useBoardStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createProject = useBoardStore((state) => state.createProject);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [keyTouched, setKeyTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setKey("");
    setDescription("");
    setColor(PROJECT_COLORS[0]);
    setKeyTouched(false);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextName = String(form.get("name") ?? name).trim();
    const nextKey = String(form.get("key") ?? key).trim().toUpperCase();
    const nextDescription = String(form.get("description") ?? description);
    if (!nextName) {
      setError("Name the project so it can get a board.");
      return;
    }
    try {
      const id = createProject({
        name: nextName,
        key: nextKey || keyFromName(nextName),
        description: nextDescription,
        color,
      });
      handleOpenChange(false);
      router.push(`/projects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the project.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              A project is a board with its own issue keys and workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Name</span>
              <Input
                name="name"
                value={name}
                autoFocus
                placeholder="Payments"
                onChange={(event) => {
                  setName(event.target.value);
                  if (!keyTouched) setKey(keyFromName(event.target.value));
                }}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Key</span>
              <Input
                name="key"
                value={key}
                maxLength={5}
                placeholder="PAY"
                className="font-mono uppercase"
                onChange={(event) => {
                  setKeyTouched(true);
                  setKey(event.target.value.toUpperCase());
                }}
              />
              <span className="text-xs text-muted-foreground">
                Short prefix for issue IDs. A project named Payments with key{" "}
                <span className="font-mono">{key || "PAY"}</span> numbers work as{" "}
                <span className="font-mono">{key || "PAY"}-1</span>,{" "}
                <span className="font-mono">{key || "PAY"}-2</span>, and so on.
              </span>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Description</span>
              <Textarea
                name="description"
                value={description}
                rows={3}
                placeholder="What this team is shipping."
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Color</span>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Use color ${swatch}`}
                    onClick={() => setColor(swatch)}
                    className={cn(
                      "size-6 rounded-full ring-offset-background transition",
                      color === swatch && "ring-2 ring-ring ring-offset-2"
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
