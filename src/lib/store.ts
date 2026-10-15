"use client";

import { create } from "zustand";

import { apiSync, apiWorkspace } from "@/lib/api";
import { readCache, readOutbox, writeCache, writeOutbox, writeSession } from "@/lib/cache";
import { isDemoUserId } from "@/lib/demo";
import { uid } from "@/lib/format";
import {
  applyOp,
  DEFAULT_COLUMNS,
  emptyWorkspace,
  makeOp,
  type CreateIssueInput,
  type CreateProjectInput,
  type Op,
  type UpdateIssueInput,
} from "@/lib/ops";
import { personFromUser } from "@/lib/people";
import { createSeedWorkspace } from "@/lib/seed";
import type { Project, SessionUser, SyncStatus, Workspace } from "@/lib/types";

type BoardStore = Workspace & {
  user: SessionUser | null;
  hydrated: boolean;
  syncStatus: SyncStatus;
  outbox: Op[];
  lastSyncedAt: string | null;
  error: string | null;
  hydrate: (user: SessionUser) => Promise<void>;
  signOutLocal: () => void;
  flush: () => Promise<void>;
  pull: () => Promise<void>;
  markOffline: () => void;
  createProject: (input: Omit<CreateProjectInput, "ownerId" | "id" | "columns">) => string;
  updateProject: (id: string, patch: Partial<Pick<Project, "name" | "description" | "color">>) => void;
  deleteProject: (id: string) => void;
  createIssue: (input: Omit<CreateIssueInput, "id">) => string;
  updateIssue: (id: string, patch: UpdateIssueInput) => void;
  deleteIssue: (id: string) => void;
  moveIssue: (issueId: string, toColumnId: string, beforeIssueId?: string | null) => void;
  resetDemo: () => void;
};

function asWorkspace(state: Workspace): Workspace {
  return {
    people: state.people,
    labels: state.labels,
    projects: state.projects,
    issues: state.issues,
  };
}

function persist(state: BoardStore) {
  if (!state.user) return;
  writeCache(state.user.id, asWorkspace(state));
  writeOutbox(state.user.id, state.outbox);
}

let flushing = false;
let flushAgain = false;

export const useBoardStore = create<BoardStore>()((set, get) => {
  function dispatch(op: Op) {
    set((state) => {
      const next = applyOp(asWorkspace(state), op);
      const syncStatus: SyncStatus =
        typeof navigator !== "undefined" && navigator.onLine ? "pending" : "offline";
      const updated: BoardStore = {
        ...state,
        ...next,
        outbox: [...state.outbox, op],
        syncStatus,
        error: null,
      };
      persist(updated);
      return updated;
    });
    void get().flush();
  }

  return {
    ...emptyWorkspace(),
    user: null,
    hydrated: false,
    syncStatus: "saved",
    outbox: [],
    lastSyncedAt: null,
    error: null,

    hydrate: async (user) => {
      const cached = readCache(user.id);
      const outbox = readOutbox(user.id);
      const workspace = cached ?? {
        ...emptyWorkspace(),
        people: [personFromUser(user)],
      };
      const online = typeof navigator === "undefined" || navigator.onLine;
      set({
        user,
        ...workspace,
        outbox,
        hydrated: true,
        syncStatus: online ? (outbox.length ? "pending" : "syncing") : "offline",
        error: null,
      });
      writeSession(user);
      persist(get());
      if (online) {
        await get().flush();
        if (get().outbox.length === 0) await get().pull();
      }
    },

    signOutLocal: () => {
      writeSession(null);
      set({
        ...emptyWorkspace(),
        user: null,
        hydrated: false,
        outbox: [],
        syncStatus: "saved",
        lastSyncedAt: null,
        error: null,
      });
    },

    markOffline: () => {
      set((state) => ({
        syncStatus: state.outbox.length ? "pending" : "offline",
      }));
    },

    flush: async () => {
      if (flushing) {
        flushAgain = true;
        return;
      }
      const snapshot = get();
      if (!snapshot.user) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        set({ syncStatus: snapshot.outbox.length ? "pending" : "offline" });
        return;
      }
      flushing = true;
      set({ syncStatus: snapshot.outbox.length ? "syncing" : snapshot.syncStatus });
      let switchToUser: SessionUser | null = null;
      try {
        const expectedUserId = snapshot.user.id;
        const ops = get().outbox;
        const result = ops.length ? await apiSync(ops) : { ...(await apiWorkspace()), applied: [] };
        if (result.user.id !== expectedUserId) {
          switchToUser = result.user;
          return;
        }
        if (get().user?.id !== expectedUserId) return;
        const leftover = get().outbox.filter((op) => !result.applied.includes(op.id));
        let workspace = result.workspace;
        for (const op of leftover) workspace = applyOp(workspace, op);
        const next: BoardStore = {
          ...get(),
          ...workspace,
          outbox: leftover,
          syncStatus: leftover.length ? "pending" : "saved",
          lastSyncedAt: new Date().toISOString(),
          error: null,
        };
        if (next.user?.id !== expectedUserId) return;
        set(next);
        persist(next);
      } catch (error) {
        const message = error instanceof Error ? error.message : "sync";
        if (message === "unauthorized") {
          get().signOutLocal();
          return;
        }
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        set({
          syncStatus: offline || message === "Failed to fetch" ? (get().outbox.length ? "pending" : "offline") : "error",
          error: offline ? null : message,
        });
      } finally {
        flushing = false;
        if (switchToUser) {
          flushAgain = false;
          void get().hydrate(switchToUser);
        } else if (flushAgain) {
          flushAgain = false;
          void get().flush();
        }
      }
    },

    pull: async () => {
      if (get().outbox.length || flushing) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        set({ syncStatus: "offline" });
        return;
      }
      const expectedUserId = get().user?.id;
      if (!expectedUserId) return;
      try {
        set({ syncStatus: "syncing" });
        const result = await apiWorkspace();
        if (result.user.id !== expectedUserId) {
          void get().hydrate(result.user);
          return;
        }
        if (get().user?.id !== expectedUserId) return;
        const leftover = get().outbox;
        let nextWorkspace = result.workspace;
        for (const op of leftover) nextWorkspace = applyOp(nextWorkspace, op);
        const next: BoardStore = {
          ...get(),
          ...nextWorkspace,
          syncStatus: leftover.length ? "pending" : "saved",
          lastSyncedAt: new Date().toISOString(),
          error: null,
        };
        if (next.user?.id !== expectedUserId) return;
        set(next);
        persist(next);
      } catch (error) {
        const message = error instanceof Error ? error.message : "sync";
        if (message === "unauthorized") {
          get().signOutLocal();
          return;
        }
        set({
          syncStatus: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error",
          error: message,
        });
      }
    },

    createProject: (input) => {
      const user = get().user;
      if (!user) throw new Error("Sign in to create a project.");
      const id = uid("proj");
      const columns = DEFAULT_COLUMNS.map((column) => ({
        id: uid("col"),
        name: column.name,
        wipLimit: column.wipLimit,
      }));
      dispatch(
        makeOp("createProject", {
          ...input,
          id,
          ownerId: user.id,
          columns,
        })
      );
      return id;
    },

    updateProject: (id, patch) => {
      dispatch(makeOp("updateProject", { id, patch }));
    },

    deleteProject: (id) => {
      dispatch(makeOp("deleteProject", { id }));
    },

    createIssue: (input) => {
      const id = uid("issue");
      dispatch(makeOp("createIssue", { ...input, id }));
      return id;
    },

    updateIssue: (id, patch) => {
      dispatch(makeOp("updateIssue", { id, patch }));
    },

    deleteIssue: (id) => {
      dispatch(makeOp("deleteIssue", { id }));
    },

    moveIssue: (issueId, toColumnId, beforeIssueId) => {
      dispatch(makeOp("moveIssue", { issueId, toColumnId, beforeIssueId: beforeIssueId ?? null }));
    },

    resetDemo: () => {
      const user = get().user;
      if (!user || !isDemoUserId(user.id)) return;
      dispatch(
        makeOp("resetDemo", {
          ownerId: user.id,
          workspace: createSeedWorkspace(),
        })
      );
    },
  };
});
