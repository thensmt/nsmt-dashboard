import fs from "node:fs/promises";
import path from "node:path";
import { fetchProjects } from "@/lib/github";
import type { ProjectsPayload } from "@/types";
import { Shell } from "@/components/Shell";
import { auth, signOut } from "@/auth";

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

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function HomePage() {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email ?? "";
  const userInitial =
    name
      .split(/[\s@.]/)
      .filter(Boolean)[0]
      ?.charAt(0)
      .toUpperCase() || "·";

  const payload = await getPayload();
  return (
    <Shell
      initial={payload}
      userInitial={userInitial}
      userName={session?.user?.name ?? session?.user?.email ?? null}
      onSignOut={signOutAction}
    />
  );
}
