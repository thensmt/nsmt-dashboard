const DAY_MS = 1000 * 60 * 60 * 24;
export const DRIFT_THRESHOLD_DAYS = 60;

export function daysSince(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / DAY_MS);
}

export function isDrifted(
  lastCommit: string | null | undefined,
  status: string,
): boolean {
  if (status !== "Active" && status !== "In Progress") return false;
  const days = daysSince(lastCommit);
  if (days === null) return false;
  return days > DRIFT_THRESHOLD_DAYS;
}
