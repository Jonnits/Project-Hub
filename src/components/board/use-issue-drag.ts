"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVATE_DISTANCE = 8;

export type IssueDragState = {
  issueId: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  overColumnId: string | null;
  overIssueId: string | null;
};

function hitTest(x: number, y: number) {
  const top = document.elementFromPoint(x, y);
  if (!(top instanceof Element)) {
    return { overColumnId: null, overIssueId: null };
  }
  const columnEl = top.closest("[data-column-id]");
  const issueEl = top.closest("[data-issue-id]");
  return {
    overColumnId:
      columnEl instanceof HTMLElement ? (columnEl.dataset.columnId ?? null) : null,
    overIssueId:
      issueEl instanceof HTMLElement ? (issueEl.dataset.issueId ?? null) : null,
  };
}

export function useIssueDrag(
  onDrop: (
    issueId: string,
    columnId: string,
    beforeIssueId?: string | null
  ) => void
) {
  const [drag, setDrag] = useState<IssueDragState | null>(null);
  const sessionRef = useRef<{
    issueId: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    activated: boolean;
  } | null>(null);
  const onDropRef = useRef(onDrop);
  const justDragged = useRef(false);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const startDrag = useCallback((issueId: string, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    if (sessionRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    sessionRef.current = {
      issueId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      activated: false,
    };

    const onMove = (ev: PointerEvent) => {
      const session = sessionRef.current;
      if (!session) return;
      const dx = ev.clientX - session.startX;
      const dy = ev.clientY - session.startY;
        if (!session.activated) {
          if (dx * dx + dy * dy < ACTIVATE_DISTANCE * ACTIVATE_DISTANCE) return;
          session.activated = true;
          justDragged.current = true;
          document.body.style.userSelect = "none";
          document.body.style.cursor = "grabbing";
        }
      ev.preventDefault();
      const hits = hitTest(ev.clientX, ev.clientY);
      setDrag({
        issueId: session.issueId,
        x: ev.clientX,
        y: ev.clientY,
        offsetX: session.offsetX,
        offsetY: session.offsetY,
        ...hits,
      });
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      const session = sessionRef.current;
      sessionRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (!session?.activated) {
        setDrag(null);
        return;
      }
      justDragged.current = true;
      ev.preventDefault();
      const suppressClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopImmediatePropagation();
      };
      document.addEventListener("click", suppressClick, true);
      window.setTimeout(() => {
        justDragged.current = false;
        document.removeEventListener("click", suppressClick, true);
      }, 280);
      const hits = hitTest(ev.clientX, ev.clientY);
      if (hits.overColumnId) {
        onDropRef.current(
          session.issueId,
          hits.overColumnId,
          hits.overIssueId && hits.overIssueId !== session.issueId
            ? hits.overIssueId
            : null
        );
      }
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
  }, []);

  return { drag, startDrag, didJustDrag: () => justDragged.current };
}
