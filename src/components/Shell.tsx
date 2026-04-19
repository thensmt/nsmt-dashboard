"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GhostRepo, Project, ProjectOverride, ProjectsPayload } from "@/types";
import {
  mergeDrafts,
  readOverrides,
  removeDraft,
  saveDraft,
} from "@/lib/overrides";
import { STATUS_ORDER } from "@/lib/projects";
import { currentIsoWeekLabel, presentModeSublabel } from "@/lib/isoWeek";
import { Topbar } from "./Topbar";
import { FocusBandA } from "./FocusBandA";
import { FocusBandB } from "./FocusBandB";
import { ProjectCard } from "./ProjectCard";
import { GhostCard } from "./GhostCard";
import { SetupForm } from "./SetupForm";
import { NewProjectCard } from "./NewProjectCard";
import { VariationToggle } from "./VariationToggle";
import { HelpPopover } from "./HelpPopover";

interface Props {
  initial: ProjectsPayload;
}

type GhostState = Record<string, "ghost" | "setup" | "skipped">;

const FILTERS = ["all", "Broadcast", "Marketplace", "Tooling", "Event", "Paused"] as const;
type Filter = (typeof FILTERS)[number];

export function Shell({ initial }: Props) {
  const [payload, setPayload] = useState<ProjectsPayload>(initial);
  const [drafts, setDrafts] = useState<Record<string, ProjectOverride>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ghostState, setGhostState] = useState<GhostState>({});
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const manualSessionId = useRef(`manual-${Date.now()}`).current;

  useEffect(() => {
    setDrafts(readOverrides().drafts);
  }, []);

  const merged: Project[] = useMemo(
    () => mergeDrafts(payload.projects, drafts),
    [payload.projects, drafts],
  );

  const ghosts: GhostRepo[] = useMemo(
    () => payload.ghosts.filter((g) => !drafts[g.id]),
    [payload.ghosts, drafts],
  );

  const focusProjects = useMemo(() => {
    const sorted = [...merged].sort(
      (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
    );
    return sorted
      .filter((p) => p.status === "Active" || p.status === "In Progress")
      .slice(0, 2);
  }, [merged]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: merged.length,
      Broadcast: 0,
      Marketplace: 0,
      Tooling: 0,
      Event: 0,
      Paused: 0,
    };
    for (const p of merged) {
      if (p.status === "Paused") c.Paused++;
      if (c[p.type] !== undefined) c[p.type]++;
    }
    return c;
  }, [merged]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return merged.map((p) => {
      let match = true;
      if (filter === "Paused") match = p.status === "Paused";
      else if (filter !== "all") match = p.type === filter;
      if (match && q) {
        const hay = `${p.name} ${p.desc} ${p.commit.msg ?? ""} ${p.stack.join(
          " ",
        )}`.toLowerCase();
        match = hay.includes(q);
      }
      return { project: p, match };
    });
  }, [merged, filter, search]);

  useEffect(() => {
    document.documentElement.classList.toggle("present", present);
  }, [present]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("present");
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/projects?refresh=1", { cache: "no-store" });
      const data = (await res.json()) as ProjectsPayload;
      setPayload(data);
      setGhostState({});
    } catch (e) {
      console.error("refresh failed", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  function startConfigure(id: string) {
    setGhostState((s) => ({ ...s, [id]: "setup" }));
  }
  function cancelConfigure(id: string) {
    setGhostState((s) => ({ ...s, [id]: "ghost" }));
  }
  function skipGhost(id: string) {
    setGhostState((s) => ({ ...s, [id]: "skipped" }));
  }
  function saveDraftAndClose(draft: ProjectOverride) {
    saveDraft(draft);
    setDrafts((d) => ({ ...d, [draft.id]: draft }));
    setGhostState((s) => {
      const next = { ...s };
      delete next[draft.id];
      return next;
    });
    setNewProjectOpen(false);
  }
  function deleteDraft(id: string) {
    removeDraft(id);
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }
  void deleteDraft;

  const weekLabel = currentIsoWeekLabel();
  const presentSub = presentModeSublabel();

  return (
    <>
      <Topbar
        isoWeekLabel={weekLabel}
        search={search}
        onSearch={setSearch}
        onRefresh={refresh}
        refreshing={refreshing}
        onToggleHelp={() => setHelpOpen((v) => !v)}
        present={present}
        onTogglePresent={() => setPresent((v) => !v)}
      />

      {payload.stale && (
        <div className="stale-banner">
          <span>· showing last-known data ·</span>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontWeight: 500,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            {payload.fallbackReason ?? "github unreachable"}
          </span>
        </div>
      )}

      <FocusBandA projects={focusProjects} />
      <FocusBandB projects={focusProjects} />

      <div className="filters">
        <span className="section-title">All Projects</span>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-chip ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f} <span className="count">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="grid-wrap">
        <div className="grid">
          {filteredProjects.map(({ project, match }) => (
            <ProjectCard
              key={project.id}
              project={project}
              extraClass={
                !match ? "fade" : filter !== "all" || search.trim() ? "filter-hit" : ""
              }
            />
          ))}
          {ghosts.map((g) => {
            const st = ghostState[g.id] ?? "ghost";
            if (st === "setup") {
              return (
                <SetupForm
                  key={g.id}
                  repo={g.id}
                  onCancel={() => cancelConfigure(g.id)}
                  onSave={saveDraftAndClose}
                />
              );
            }
            return (
              <GhostCard
                key={g.id}
                repo={g.id}
                skipped={st === "skipped"}
                onConfigure={() => startConfigure(g.id)}
                onSkip={() => skipGhost(g.id)}
              />
            );
          })}
          {newProjectOpen ? (
            <SetupForm
              key={manualSessionId}
              repo={manualSessionId}
              manual
              onCancel={() => setNewProjectOpen(false)}
              onSave={saveDraftAndClose}
            />
          ) : (
            <NewProjectCard onClick={() => setNewProjectOpen(true)} />
          )}
        </div>
      </div>

      <VariationToggle />

      <HelpPopover open={helpOpen} onClose={() => setHelpOpen(false)} />

      <div className="toast" id="toast">
        Copied
      </div>

      <PresentSubheader sub={presentSub} />
    </>
  );
}

function PresentSubheader({ sub }: { sub: string }) {
  useEffect(() => {
    const bands = document.querySelectorAll<HTMLElement>(".focus-band");
    bands.forEach((b) => b.setAttribute("data-present-sub", sub));
  }, [sub]);
  return null;
}
