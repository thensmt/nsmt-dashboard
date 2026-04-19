"use client";

import type { Project } from "@/types";
import { GitHubIcon, ExternalIcon } from "./icons";
import { PriorityBecause } from "./PriorityBecause";

function Card({ project }: { project: Project }) {
  return (
    <div className="focus-card">
      <div className="rail" />
      <div className="body">
        <div>
          <div className="row1">
            <span className="status-dot" />
            <span className="type-tag">
              {project.type} · {project.status}
            </span>
          </div>
          <h2 className="name">{project.name}</h2>
        </div>
        <div className="desc">{project.desc}</div>
        <div className="next">{project.next}</div>
      </div>
      <div className="side">
        <div>
          <div className="commit-label">Last Commit</div>
          <div className="sha">{project.commit.sha}</div>
        </div>
        <div className="links">
          {project.github && (
            <a href={project.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GitHubIcon />
            </a>
          )}
          {project.live && (
            <a href={project.live} target="_blank" rel="noreferrer" aria-label="Live URL">
              <ExternalIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function FocusBandA({ projects }: { projects: Project[] }) {
  return (
    <section className="variation-section" data-variation="a">
      <div className="focus-band">
        <div className="focus-header">
          <span className="focus-kicker">This Week&rsquo;s Focus</span>
          <span className="focus-sub">Two things. The rest is peripheral.</span>
        </div>
        <PriorityBecause />
        <div className="band-a">
          {projects.map((p) => (
            <Card key={p.id} project={p} />
          ))}
        </div>
        <div className="focus-swipe" data-swipe="a">
          <span>
            <span>01</span> / <span>{String(projects.length).padStart(2, "0")}</span>
          </span>
          <div className="dots">
            {projects.map((p, i) => (
              <span key={p.id} className={`dot ${i === 0 ? "active" : ""}`} />
            ))}
          </div>
          <span>Swipe</span>
        </div>
        <div className="scanline" />
      </div>
    </section>
  );
}
