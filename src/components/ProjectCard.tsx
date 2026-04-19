"use client";

import type { Project } from "@/types";
import { statusClass } from "@/lib/utils";
import { GitHubIcon, ExternalIcon, CopyIcon, CheckIcon } from "./icons";

function StatusChip({ status }: { status: Project["status"] }) {
  if (status === "Active")
    return (
      <span className="status status-active">
        <span className="s-dot" />
        Active
      </span>
    );
  if (status === "In Progress")
    return (
      <span className="status status-inprogress">
        <span className="s-dot" />
        In Progress
      </span>
    );
  if (status === "Paused")
    return (
      <span className="status status-paused-chip">
        <span className="s-dot" />
        Paused
      </span>
    );
  return (
    <span className="status status-shipped">
      <span className="s-check">
        <CheckIcon />
      </span>
      Shipped
    </span>
  );
}

function StackRow({ stack }: { stack: string[] }) {
  if (!stack?.length) {
    return (
      <div className="stack">
        <span className="stack-empty">// stack not detected</span>
      </div>
    );
  }
  return (
    <div className="stack">
      {stack.map((s) => (
        <span key={s} className="stack-badge">
          {s}
        </span>
      ))}
    </div>
  );
}

function CommitRow({ project }: { project: Project }) {
  const { commit, drift, noCommits } = project;
  const tsClass = drift ? "drift" : !commit.ts ? "pending" : "";
  const tsLabel = commit.ts ?? (noCommits ? "no commits yet" : "— sync pending");
  return (
    <div className="commit">
      <span className="sha">{commit.sha}</span>
      {commit.msg ? (
        <span className="msg">{commit.msg}</span>
      ) : (
        <span
          className="msg"
          style={{ color: "var(--ink-40)", fontStyle: "italic" }}
        >
          — no commit message synced
        </span>
      )}
      <span className={`ts ${tsClass}`}>{tsLabel}</span>
    </div>
  );
}

function copyPath(path: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  navigator.clipboard.writeText(path);
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = `Copied · ${path.split("/").pop() ?? path}`;
  t.classList.add("show");
  const w = window as typeof window & { _toastT?: ReturnType<typeof setTimeout> };
  if (w._toastT) clearTimeout(w._toastT);
  w._toastT = setTimeout(() => t.classList.remove("show"), 1400);
}

export function ProjectCard({
  project,
  extraClass,
}: {
  project: Project;
  extraClass?: string;
}) {
  const { type, status, name, subname, desc, github, live, path } = project;
  const classes = [
    "card",
    statusClass(status),
    project.localOnly ? "local-only" : "",
    extraClass ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <article
      className={classes}
      data-type={type}
      data-status={status}
      data-name={name.toLowerCase()}
    >
      {status === "Shipped" && <div className="shipped-watermark">SHIPPED</div>}
      <div className="c-top">
        <span className="type-tag">{type}</span>
        <StatusChip status={status} />
      </div>
      <h3 className="name">
        {name}
        {subname && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--ink-40)",
              fontWeight: 500,
              marginLeft: 6,
            }}
          >
            ({subname})
          </span>
        )}
      </h3>
      <p className="desc">{desc}</p>
      <StackRow stack={project.stack} />
      <CommitRow project={project} />
      <div className="path">
        <code>{path}</code>
        <button
          className="copy-btn"
          onClick={() => copyPath(path)}
          title="Copy path"
          aria-label="Copy path"
          type="button"
        >
          <CopyIcon />
        </button>
      </div>
      <div className="next-action">{project.next}</div>
      <div className="links" style={{ marginTop: -4 }}>
        {github ? (
          <a href={github} target="_blank" rel="noreferrer" title="GitHub" aria-label="GitHub">
            <GitHubIcon />
          </a>
        ) : (
          <span
            style={{
              width: 28,
              height: 28,
              border: "1px dashed var(--ink-10)",
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              color: "var(--ink-20)",
              fontFamily: "var(--mono)",
              fontSize: 11,
            }}
          >
            —
          </span>
        )}
        {live ? (
          <a href={live} target="_blank" rel="noreferrer" title="Live URL" aria-label="Live URL">
            <ExternalIcon />
          </a>
        ) : (
          <span
            style={{
              width: 28,
              height: 28,
              border: "1px dashed var(--ink-10)",
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              color: "var(--ink-20)",
              fontFamily: "var(--mono)",
              fontSize: 11,
            }}
          >
            —
          </span>
        )}
      </div>
    </article>
  );
}
