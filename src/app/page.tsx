import fs from "node:fs/promises";
import path from "node:path";
import { fetchProjects } from "@/lib/github";
import type { ProjectsPayload } from "@/types";
import { Shell } from "@/components/Shell";

export const revalidate = 3600;

async function getPayload(): Promise<ProjectsPayload> {
  try {
    return await fetchProjects();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    try {
      const fp = path.join(process.cwd(), "public", "data.json");
      const raw = await fs.readFile(fp, "utf-8");
      const data = JSON.parse(raw) as ProjectsPayload;
      return { ...data, stale: true, fallbackReason: reason };
    } catch {
      return {
        fetchedAt: new Date().toISOString(),
        projects: [],
        ghosts: [],
        errors: [],
        stale: true,
        fallbackReason: reason,
      };
    }
  }
}

export default async function HomePage() {
  const payload = await getPayload();
  return <Shell initial={payload} />;
}
