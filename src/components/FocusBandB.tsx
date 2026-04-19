"use client";

import type { Project } from "@/types";
import { GitHubIcon, ExternalIcon, ChevronRightIcon } from "./icons";
import { PriorityBecause } from "./PriorityBecause";

function Card({ project, idx, total }: { project: Project; idx: number; total: number }) {
  return (
    <div className="focus-card">
      <div className="hero-top">
        <span className="status-chip">
          <span className="pulse" />
          {project.status}
        </span>
        <span className="type-tag">{project.type}</span>
        <span className="priority">
          focus · {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
      <div className="hero-body">
        <h2 className="name">{project.name}</h2>
        <p className="desc">{project.desc}</p>
      </div>
      <div className="hero-foot">
        <div className="next">
          <span className="arrow">
            <ChevronRightIcon />
          </span>
          {project.next}
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

export function FocusBandB({ projects }: { projects: Project[] }) {
  return (
    <section className="variation-section" data-variation="b">
      <div className="focus-band">
        <div className="focus-header">
          <span className="focus-kicker">This Week&rsquo;s Focus</span>
          <span className="focus-sub">Two things. The rest is peripheral.</span>
        </div>
        <PriorityBecause />
        <div className="band-b">
          {projects.map((p, i) => (
            <Card key={p.id} project={p} idx={i} total={projects.length} />
          ))}
        </div>
        <div className="scanline" />
      </div>
    </section>
  );
}
