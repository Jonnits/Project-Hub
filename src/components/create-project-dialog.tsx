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

  function reset() {
    setName("");
    setKey("");
    setDescription("");
    setColor(PROJECT_COLORS[0]);
    setKeyTouched(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!name.trim()) return;
    const id = createProject({
      name,
      key: key || keyFromName(name),
      description,
      color,
    });
    handleOpenChange(false);
    router.push(`/projects/${id}`);
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!name.trim()} onClick={handleSubmit}>
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
