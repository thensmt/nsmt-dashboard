/**
 * ISO-8601 week number for a Date. Week 1 is the week with the first Thursday.
 */
export function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatShortDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * "Week 16 · Apr 19, 2026" — used by Topbar meta AND the Present-mode sub-header.
 * Callers pass in `now` so server and client renders agree during hydration.
 */
export function currentIsoWeekLabel(now: Date = new Date()): string {
  return `Week ${getIsoWeek(now)} · ${formatShortDate(now)}`;
}

export function presentModeSublabel(now: Date = new Date()): string {
  return `A portfolio of active work — Nova Sports Media Team · ${currentIsoWeekLabel(now)}`;
}
