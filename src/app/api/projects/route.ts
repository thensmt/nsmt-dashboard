import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { fetchProjects } from "@/lib/github";
import type { ProjectsPayload } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readFallback(): Promise<ProjectsPayload | null> {
  try {
    const fp = path.join(process.cwd(), "public", "data.json");
    const raw = await fs.readFile(fp, "utf-8");
    return JSON.parse(raw) as ProjectsPayload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

  try {
    const payload = await fetchProjects({ forceRefresh });
    return NextResponse.json(payload, {
      headers: forceRefresh
        ? { "Cache-Control": "no-store" }
        : {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const fallback = await readFallback();
    if (!fallback) {
      return NextResponse.json(
        { error: reason, fetchedAt: new Date().toISOString(), projects: [], ghosts: [], errors: [] },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { ...fallback, stale: true, fallbackReason: reason },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
