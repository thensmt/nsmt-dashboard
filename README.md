# NSMT Dashboard

Personal projects dashboard for Nova Sports Media Team. Tracks active broadcast
work (`nsmt-livestream`, `scorebug`), product builds (`bitburg`), internal
tooling, and shipped projects across `thensmt/*` GitHub repos.

See `PLAN.md` for the full implementation spec.

## Setup

```bash
cp .env.local.example .env.local
# edit .env.local and paste a fine-grained GitHub PAT:
#   - Resource owner: thensmt
#   - Repository access: All repositories (or selected)
#   - Permissions:
#       Repository → Contents: Read-only
#       Repository → Metadata: Read-only
bun install
bun run dev
```

Open `http://localhost:3000`.

## Offline / fixture mode

```bash
NSMT_USE_FIXTURE=1 bun run dev
```

Reads `__fixtures__/repos.json` instead of hitting GitHub. Useful when working
on a plane or when `GITHUB_TOKEN` isn't available.

## Adding a tracked project

Two paths:

**a) Code path (durable, all devices).** Edit `src/lib/projects.ts` and add a
new entry to `PROJECT_META` keyed by repo slug. Commit and push.

**b) UI path (no code change).** When the dashboard detects a `thensmt/*` repo
that isn't in `PROJECT_META`, it renders a ghost card. Click **Configure →**,
fill the form, save. The draft is stored in `localStorage`. Then open the help
popover (`?` in the topbar) and click **Export configured projects** — that
downloads `projects-overrides.json`. Commit it to the repo root to make the
configuration cross-device.

## Data freshness

Three freshness paths, in order of authority:

1. **Live Octokit fetch** — happens on page render, cached for 1 hour via Next
   ISR. Hitting the **Refresh** button in the topbar bypasses cache
   (`/api/projects?refresh=1`).
2. **Committed `public/data.json`** — kept fresh by the hourly
   `fetch-projects` GitHub Actions workflow (`.github/workflows/fetch-projects.yml`).
   Used as fallback when the live fetch fails.
3. **Seed `public/data.json`** — initial commit ships with "sync pending"
   placeholders so the dashboard renders something even with no token.

If a live fetch fails, a stale banner appears at the top of the page showing
the reason and "showing last-known data".

## Manually refresh `public/data.json`

```bash
GITHUB_TOKEN=xxxx bun run fetch-data
```

Then commit the change.

## Deploy (Vercel)

```bash
vercel
```

Set `GITHUB_TOKEN` in the Vercel project environment. The Vercel serverless
filesystem is read-only — the route handler **never writes** `data.json` at
runtime; only the Actions workflow does.

## Architecture notes

- Two layout variations: **Broadcast bar** (A) and **Editorial hero** (B).
  Both are mounted; CSS toggles visibility via `html.variation-a|b`. The
  variation class is set pre-hydration to avoid flash.
- Theme (`html.dark`) and quiet-motion (`html.quiet-motion`) are also set
  pre-hydration by the inline script in `src/components/PreHydrationScript.tsx`.
  `<html>` has `suppressHydrationWarning` for this narrow case.
- Present mode (`html.present`) is **session-only** — reload clears it.
- Mobile (≤640px) shows Variation A only and hides the variation toggle.

## Motion

Infinite loops (barber-pole rails, active-chip pulse, ghost marching dashes)
respect both `prefers-reduced-motion` **and** the Quiet-motion toggle in the
help popover. One-shot animations (topbar sweep, card rise, focus scanline)
still play under quiet-motion.
