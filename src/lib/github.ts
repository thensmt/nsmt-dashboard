import { Octokit } from "@octokit/rest";
import fs from "node:fs/promises";
import path from "node:path";
import { CommitSchema, RepoSchema, type Repo } from "./schema";
import { PROJECT_META } from "./projects";
import { isDrifted } from "./drift";
import type { GhostRepo, Project, ProjectsPayload } from "@/types";

export const GITHUB_OWNER = "thensmt";

interface FetchOpts {
  /** Bypass Next.js data cache for the Octokit calls — used by ?refresh=1. */
  forceRefresh?: boolean;
}

function formatTimestamp(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const now = Date.now();
  const diff = Math.max(0, now - t);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

async function loadFixtureRepos(): Promise<Repo[]> {
  const fp = path.join(process.cwd(), "__fixtures__", "repos.json");
  const raw = await fs.readFile(fp, "utf-8");
  const parsed = JSON.parse(raw);
  return parsed.map((r: unknown) => RepoSchema.parse(r));
}

async function listRepos(octokit: Octokit, forceRefresh: boolean): Promise<Repo[]> {
  const repos = await octokit.paginate(octokit.repos.listForUser, {
    username: GITHUB_OWNER,
    per_page: 100,
    request: forceRefresh ? { cache: "no-store" } : undefined,
  });
  return repos.map((r) => RepoSchema.parse(r));
}

async function fetchLastCommit(
  octokit: Octokit,
  repo: Repo,
  forceRefresh: boolean,
): Promise<{ sha: string; message: string; date: string | null } | null> {
  if (!repo.default_branch) return null;
  try {
    const { data } = await octokit.repos.listCommits({
      owner: GITHUB_OWNER,
      repo: repo.name,
      sha: repo.default_branch,
      per_page: 1,
      request: forceRefresh ? { cache: "no-store" } : undefined,
    });
    if (!data.length) return null;
    const parsed = CommitSchema.parse(data[0]);
    const date =
      parsed.commit.committer?.date ?? parsed.commit.author?.date ?? null;
    return { sha: parsed.sha.slice(0, 7), message: parsed.commit.message, date };
  } catch (e) {
    // 409 = empty repo (no commits yet)
    const status = (e as { status?: number }).status;
    if (status === 409) return null;
    throw e;
  }
}

export async function fetchProjects(opts: FetchOpts = {}): Promise<ProjectsPayload> {
  const useFixture = process.env.NSMT_USE_FIXTURE === "1";
  const token = process.env.GITHUB_TOKEN;

  if (!useFixture && !token) {
    throw new Error("GITHUB_TOKEN not set");
  }

  const octokit = new Octokit({ auth: token });
  const repos: Repo[] = useFixture
    ? await loadFixtureRepos()
    : await listRepos(octokit, !!opts.forceRefresh);

  const filtered = repos.filter((r) => !r.fork && !r.archived);

  // Split tracked vs untracked before hitting the commits endpoint so ghost
  // cards don't waste a request each.
  const tracked = filtered.filter((r) => r.name in PROJECT_META);
  const untracked = filtered.filter((r) => !(r.name in PROJECT_META));

  const errors: Array<{ repo: string; error: string }> = [];
  const commits = await Promise.all(
    tracked.map(async (repo) => {
      if (useFixture) return null;
      try {
        return await fetchLastCommit(octokit, repo, !!opts.forceRefresh);
      } catch (e) {
        errors.push({
          repo: repo.name,
          error: e instanceof Error ? e.message : String(e),
        });
        return null;
      }
    }),
  );

  const projects: Project[] = tracked.map((repo, idx) => {
    const meta = PROJECT_META[repo.name]!;
    const commit = commits[idx];
    const firstLine = commit?.message.split("\n")[0] ?? null;

    return {
      id: repo.name,
      name: meta.displayName ?? repo.name,
      subname: meta.subname,
      type: meta.type,
      status: meta.status,
      desc: meta.desc,
      next: meta.next,
      stack: meta.stack,
      commit: {
        sha: commit?.sha ?? "—",
        msg: firstLine,
        ts: formatTimestamp(commit?.date ?? null),
      },
      github: repo.html_url,
      live: meta.live,
      path: meta.path,
      drift: isDrifted(commit?.date ?? null, meta.status),
      noCommits: !commit,
    };
  });

  const ghosts: GhostRepo[] = untracked.map((repo) => ({
    id: repo.name,
    name: repo.name,
    github: repo.html_url,
  }));

  return {
    fetchedAt: new Date().toISOString(),
    projects,
    ghosts,
    errors,
  };
}
