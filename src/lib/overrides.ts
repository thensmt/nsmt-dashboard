"use client";

import type { Project, ProjectOverride, ProjectStatus, ProjectType } from "@/types";
import { isDrifted } from "./drift";

const OVERRIDES_KEY = "nsmt-project-overrides";

export interface OverridesStore {
  drafts: Record<string, ProjectOverride>;
}

function emptyStore(): OverridesStore {
  return { drafts: {} };
}

export function readOverrides(): OverridesStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.drafts) return emptyStore();
    return parsed as OverridesStore;
  } catch {
    return emptyStore();
  }
}

export function writeOverrides(store: OverridesStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(store));
}

export function saveDraft(draft: ProjectOverride): void {
  const store = readOverrides();
  store.drafts[draft.id] = draft;
  writeOverrides(store);
}

export function removeDraft(id: string): void {
  const store = readOverrides();
  delete store.drafts[id];
  writeOverrides(store);
}

/**
 * Turn a saved draft into a Project. Used when merging localStorage drafts
 * back into the server-fetched list.
 */
export function draftToProject(draft: ProjectOverride): Project {
  return {
    id: draft.id,
    name: draft.name ?? draft.id,
    subname: draft.subname,
    type: (draft.type as ProjectType) ?? "Tooling",
    status: (draft.status as ProjectStatus) ?? "In Progress",
    desc: draft.desc ?? "",
    next: draft.next ?? "",
    stack: draft.stack ?? [],
    commit: { sha: "—", msg: "sync pending", ts: "just configured" },
    github: draft.manual
      ? ""
      : `https://github.com/thensmt/${draft.id}`,
    live: draft.live ?? null,
    path: draft.path ?? `~/code/${draft.id}`,
    manual: !!draft.manual,
    localOnly: true,
    drift: false,
  };
}

/**
 * Merge localStorage drafts over a server-fetched project list. Drafts that
 * already have a matching tracked project win (user is reconfiguring it); new
 * IDs get appended. Ghost IDs that now have a draft are removed from the
 * ghost list by the caller.
 */
export function mergeDrafts(
  serverProjects: Project[],
  drafts: Record<string, ProjectOverride>,
): Project[] {
  const byId = new Map(serverProjects.map((p) => [p.id, p]));
  for (const draft of Object.values(drafts)) {
    const existing = byId.get(draft.id);
    if (existing) {
      const next: Project = {
        ...existing,
        type: (draft.type as ProjectType) ?? existing.type,
        status: (draft.status as ProjectStatus) ?? existing.status,
        desc: draft.desc ?? existing.desc,
        next: draft.next ?? existing.next,
        stack: draft.stack ?? existing.stack,
        live: draft.live ?? existing.live,
        path: draft.path ?? existing.path,
        subname: draft.subname ?? existing.subname,
        localOnly: true,
      };
      next.drift = isDrifted(null, next.status) ? false : existing.drift;
      byId.set(draft.id, next);
    } else {
      byId.set(draft.id, draftToProject(draft));
    }
  }
  return Array.from(byId.values());
}

export function exportDraftsJson(store: OverridesStore): string {
  return JSON.stringify(store.drafts, null, 2);
}

export function downloadDrafts(store: OverridesStore): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([exportDraftsJson(store)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "projects-overrides.json";
  a.click();
  URL.revokeObjectURL(url);
}
