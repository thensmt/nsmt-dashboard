#!/usr/bin/env tsx
/**
 * Fetches projects from GitHub and writes to public/data.json.
 * Runs in plain Node (not Next.js), so it can be invoked by GitHub Actions
 * or manually (`bun run fetch-data`) without booting the app.
 *
 * Reads GITHUB_TOKEN from env. Safe to no-op commit (CI checks `git diff`).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fetchProjects } from "../src/lib/github";

async function main() {
  if (!process.env.GITHUB_TOKEN && process.env.NSMT_USE_FIXTURE !== "1") {
    console.error("GITHUB_TOKEN not set");
    process.exit(1);
  }
  const payload = await fetchProjects();
  const fp = path.join(process.cwd(), "public", "data.json");
  await fs.writeFile(fp, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  console.log(
    `wrote ${payload.projects.length} projects, ${payload.ghosts.length} ghosts, ${payload.errors.length} errors → public/data.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
