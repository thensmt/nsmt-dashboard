"use client";

import { useMemo, useState } from "react";
import type { ProjectOverride, ProjectStatus, ProjectType } from "@/types";

const TYPES: ProjectType[] = ["Broadcast", "Marketplace", "Tooling", "Event"];
const STATUSES: ProjectStatus[] = ["Active", "In Progress", "Paused", "Shipped"];

interface Props {
  repo: string;
  manual?: boolean;
  initial?: Partial<ProjectOverride>;
  onCancel: () => void;
  onSave: (draft: ProjectOverride) => void;
}

export function SetupForm({ repo, manual, initial, onCancel, onSave }: Props) {
  const [name, setName] = useState<string>(initial?.name ?? repo);
  const [type, setType] = useState<ProjectType | null>(
    (initial?.type as ProjectType) ?? null,
  );
  const [status, setStatus] = useState<ProjectStatus | null>(
    (initial?.status as ProjectStatus) ?? null,
  );
  const [desc, setDesc] = useState<string>(initial?.desc ?? "");
  const [next, setNext] = useState<string>(initial?.next ?? "");
  const [live, setLive] = useState<string>(initial?.live ?? "");

  const valid = useMemo(
    () => Boolean(type && status && desc.trim() && next.trim() && name.trim()),
    [type, status, desc, next, name],
  );

  function save() {
    if (!valid || !type || !status) return;
    const draft: ProjectOverride = {
      id: repo,
      name: name.trim(),
      type,
      status,
      desc: desc.trim(),
      next: next.trim(),
      stack: initial?.stack ?? [],
      live: live.trim() ? live.trim() : null,
      path: initial?.path ?? `~/code/${repo}`,
      manual: !!manual,
    };
    onSave(draft);
  }

  return (
    <div className="card setup" data-repo={repo}>
      <div className="setup-head">
        <span className="setup-kicker">{manual ? "New project" : "Configure"}</span>
        {manual ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            style={{ fontSize: 20, fontWeight: 900, border: 0, background: "transparent", padding: 0, color: "var(--ink-90)" }}
            aria-label="Project name"
          />
        ) : (
          <h3 className="setup-name">{repo}</h3>
        )}
      </div>

      <div>
        <label className="field-label">Type</label>
        <div className="seg-btns">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">Status</label>
        <div className="seg-btns">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={status === s ? "active" : ""}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">
          One-line description{" "}
          <span
            style={{
              color: "var(--ink-40)",
              fontWeight: 500,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            — for a non-technical partner
          </span>
        </label>
        <input
          type="text"
          maxLength={120}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What is this for a non-technical partner?"
        />
        <div className="char-count">{desc.length} / 120</div>
      </div>

      <div>
        <label className="field-label">Next action</label>
        <input
          type="text"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Verb-first. What's the one thing to do next?"
        />
      </div>

      {manual && (
        <div>
          <label className="field-label">Live URL <span style={{color:"var(--ink-40)",fontWeight:500,textTransform:"none",letterSpacing:0}}>— optional</span></label>
          <input
            type="text"
            value={live}
            onChange={(e) => setLive(e.target.value)}
            placeholder="https://..."
          />
        </div>
      )}

      <div className="setup-actions">
        <button
          type="button"
          className="btn-save"
          disabled={!valid}
          onClick={save}
        >
          Save project
        </button>
        <button type="button" className="btn-skip" onClick={onCancel}>
          {manual ? "Cancel" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
