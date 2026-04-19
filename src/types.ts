export type ProjectType = "Broadcast" | "Marketplace" | "Tooling" | "Event";
export type ProjectStatus = "Active" | "In Progress" | "Paused" | "Shipped";

export interface Commit {
  sha: string;
  msg: string | null;
  ts: string | null;
}

export interface Project {
  id: string;
  name: string;
  subname?: string;
  type: ProjectType;
  status: ProjectStatus;
  desc: string;
  next: string;
  stack: string[];
  commit: Commit;
  github: string;
  live: string | null;
  path: string;
  drift?: boolean;
  noCommits?: boolean;
  manual?: boolean;
  /** Client-only: card came from a localStorage draft, not the server fetch. */
  localOnly?: boolean;
}

export interface GhostRepo {
  id: string;
  name: string;
  github: string;
}

export interface RepoMeta {
  type: ProjectType;
  status: ProjectStatus;
  desc: string;
  next: string;
  stack: string[];
  live: string | null;
  path: string;
  subname?: string;
  displayName?: string;
}

export type ProjectOverride = {
  id: string;
  type?: ProjectType;
  status?: ProjectStatus;
  desc?: string;
  next?: string;
  stack?: string[];
  live?: string | null;
  path?: string;
  subname?: string;
  name?: string;
  manual?: boolean;
};

export interface ProjectsPayload {
  fetchedAt: string;
  projects: Project[];
  ghosts: GhostRepo[];
  errors: Array<{ repo: string; error: string }>;
  stale?: boolean;
  fallbackReason?: string;
}
