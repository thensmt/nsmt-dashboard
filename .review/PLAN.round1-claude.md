# NSMT Dashboard — Implementation Plan

> **Round 1 reviewer:** Claude (Opus 4.7, adversarial stance). Rewrite applied inline.
> **Next reviewer:** Codex. See "Handoff to round 2" at the bottom.

---

## Round 1 findings summary

Three disagreements with the user's prior decisions, plus a batch of unflagged issues. Each is expanded in detail below; this table is the executive index.

| # | Area | Severity | Finding | Recommendation |
|---|------|---------|---------|----------------|
| D1 | **Standalone Next.js 16** (user chose 1a) | HIGH | Over-engineered for one user, 6 cards, hourly refresh. Internal contradiction: "live on page load" vs `revalidate=3600`. Next 16 + React 19 + shadcn compat still settling. Vercel April 2026 incident is an active concern. | Prefer **GitHub Actions cron → static JSON + Vite SPA**. Keeps every UX feature, drops the server. If keeping Next.js, resolve the ISR/live contradiction and add explicit error handling. |
| D2 | **Live GitHub API on page load** (user chose 2b) | HIGH | Nine failure modes unaddressed: rate limit, API down, token revoked, malformed response, repo renamed/archived, private scope mismatch, pagination, forks, waterfall latency on ISR miss. Plan as written crashes the page on first GitHub incident. | Decouple fetch from render: cron job writes `data.json`, page reads JSON. No runtime token. Or, if Next stays, isolate fetch in a route handler with explicit fallback to last-known-good JSON. |
| D3 | **Both layout variations + toggle** (user chose 3a) | MEDIUM | Doubles component surface, CSS, motion rules. Toggle is a design-tool artifact, not a production feature. Variation B is already hidden on mobile. User will pick one within a week and the toggle becomes cruft. | Ship Variation A only (the `TWEAK_DEFAULTS` default). Let David test B via URL param for a week then delete. |
| D4 | Line refs in plan drift from actual | LOW | PROJECTS is at line 1153, not ~1140. `validateSetup` is 1472–1478 (6 lines), not 1472–1486. Plan's whole job is accurate references; guessing undermines it. | Corrected inline. |
| D5 | "GitHub owner" question is already answered in the bundle | LOW | Prototype hardcodes `https://github.com/thensmt/…` for all 6 repos (lines 1164, 1178, 1192, 1206, 1220, 1235). Asking the user at implementation is wasted effort. | Removed from "Config needed." |
| D6 | Ghost-card save persistence is unspecified | HIGH | Step 6 says "add to local state." Prototype persists nothing. Without persistence, the ghost→setup flow is a demo. | Spec'd: writes a JSON patch to `projects-overrides.json`, committed by user (or written to localStorage in SPA variant). Called out as **deferred decision** — depends on D1 outcome. |
| D7 | Priority-because ISO-week key is fragile | LOW | Week calc unspec'd, rollover behavior unspec'd, storage grows unbounded. | Spec'd ISO-8601 week; weekly rollover shows blank; eviction of keys >8 weeks old. |
| D8 | Drift signal spec is brittle | MEDIUM | Silent on: repos with no commits, branch selection, bot force-pushes, archived repos. | Spec'd: commit on default branch only, ignore archived, `null` last-commit = drift=false with a separate "no commits" badge. |
| D9 | Scope creep in component list | LOW | `BarberPoleRail.tsx` is CSS-only in prototype. `shadcn/dialog` listed but unused. `NewProjectCard` logic is stubbed in prototype ("not wired in demo"). | Barber pole stays CSS. Dropped dialog from install list. NewProjectCard ships as UI-only with a toast, explicitly noted. |
| D10 | No error boundary, no Suspense, no skeleton | MEDIUM | Live-fetch page with no loading or error state = blank screen on slow GitHub, crashed route on 500. | Added explicit Suspense + error boundary spec in step 5. |
| D11 | Tailwind + CSS-var tokens tension unstated | LOW | Step 3 lifts CSS vars verbatim; step 6 uses Tailwind arbitrary values. Neither mentions `tailwind.config.ts` color token mapping. | Added token-mapping substep in step 3. |
| D12 | Verification steps require unstageable conditions | LOW | "Add a repo not in projects.ts" and "find a repo with 60+ days stale" aren't reliably reproducible. | Added fixture-data fallback for local verification. |

---

## Reviewer directive: adopt an adversarial stance

**To any reviewer (Ultraplan, Codex, human) reading this plan:** don't validate — stress-test. Your job is to find what's wrong, missing, over-engineered, or load-bearing but unstated. Specifically look for:

- **Failure modes:** what breaks when GitHub API is down, rate-limited, returns malformed data, or the token expires?
- **Unstated assumptions:** what does this plan silently rely on that might not hold? (e.g., repo naming conventions, commit frequency, single-user access, localStorage availability)
- **Scope creep vs. under-scoping:** what's being built that wasn't asked for? What's being skipped that should be in scope?
- **Simpler alternatives:** where does this plan do something complex when a simpler thing would work? (e.g., is Next.js 16 + Octokit overkill vs. a static page with client-side fetch?)
- **Edge cases:** repos with no commits, repos archived/deleted, forked repos, private repos the token can't see, >100 repos requiring pagination
- **Wrong premises:** is the design itself (two layout variations, ghost-card setup flow, absolute-black dark mode) actually solving the right problem? Or is it polishing the wrong thing?
- **Hidden costs:** maintenance burden, auth token rotation, deploy complexity, cost of running live GitHub API calls on every page load
- **The "simplest thing that makes this wrong" question:** what's the most likely way this implementation will fail David a month after launch?

**Don't be polite.** If the approach is flawed, say so and propose a replacement. If a step is vague, call it out. If the plan is fine as-is, say that explicitly — but only after actively trying to break it.

---

## Context

David needs a personal projects dashboard to track all his NSMT (Nova Sports Media Team) work across GitHub repos — active broadcasts (`nsmt-livestream`), the Bitburg marketplace build, tooling, events, and shipped projects. The design was iterated in Claude Design (handoff bundle `peppy-moth`) and is now being implemented. **The delivery vehicle is contested (see D1) and needs resolution before scaffold.**

**What makes this dashboard different from a generic project list:**
- "This Week's Focus" band surfaces the two projects that matter right now, with an editable "priority because:" field as an ADHD anchor
- Ghost cards for untracked GitHub repos → inline setup form → real card (no page reload)
- Drift signal (amber underline) flags Active/In-Progress repos with no commit on default branch in 60+ days
- Presentation mode one-click strips dev-centric data (local paths, commits) for screen-sharing with partners
- Absolute `#000000` dark mode

**Decisions made with user (and Claude's round-1 pushback):**

| Decision | User's pick | Round 1 pushback | Status |
|---|---|---|---|
| 1. Target (standalone Next.js 16 vs. other) | 1a: standalone Next.js 16 | D1: recommend static + Actions cron, OR resolve ISR/live contradiction | **Deferred — awaiting Codex + user** |
| 2. Data source (live API vs. JSON) | 2b: live GitHub API | D2: add failure handling OR pre-fetch JSON | **Deferred — awaiting Codex + user** |
| 3. Layout (one vs. both) | 3a: both with toggle | D3: ship A only | **Deferred — awaiting Codex + user** |

**Design bundle source:** `/tmp/design-peppy-moth/david-dashboard/`
- `README.md`
- `chats/chat1.md` (intent)
- `project/David Dashboard.html` (80,395 bytes, 1,647 lines)
- `project/assets/wordmark-*.png`, `secondary-blue.png`

**GitHub owner (confirmed from bundle, no longer a question):** `thensmt` — all six seeded projects use `https://github.com/thensmt/…` in the prototype (lines 1164, 1178, 1192, 1206, 1220, 1235).

---

## Architectural disagreements (detailed)

These three disagreements (D1–D3) each propose a **replacement**. The rest of this plan assumes the current user choices; if Codex or the user agrees with any pushback, corresponding sections change. Each is self-contained so reviewers can accept/reject independently.

### D1: Standalone Next.js 16 — recommend static + Actions cron

**What the plan currently says:** New Next.js 16 app, server component fetches GitHub on request, `revalidate = 3600`.

**Why this is suspect:**
1. **Internal contradiction.** User's decision 2b says "live GitHub API on page load." Step 4 of the plan says `revalidate = 3600`. Those are mutually exclusive. With ISR-1hr, you are **not** live — you are "live once per hour, and live on the one unlucky request that hits a cold cache." Either drop ISR (and eat per-request latency + rate-limit risk) or drop "live" from the mental model (and accept you're pre-caching).
2. **Over-engineered for the shape of the problem.** One user, six cards, hourly refresh, no write path (except the ghost-card setup, which is itself under-specified). Server-rendered React with Octokit-in-RSC is the heaviest fit for the lightest use case.
3. **Next 16 + React 19 + shadcn compat is still maturing.** Shadcn canary is usable but not without friction. Less mature than Vite + React 18.
4. **Vercel April 2026 security incident** (visible in user's browser tab per screenshot) is a live concern for Vercel-default-deploy choices right now.
5. **Runtime token exposure.** A server-side PAT in a hosted Vercel function is safer than a browser-side PAT, but still a long-lived credential in a hosted environment. GH Actions secret (see replacement) is tighter.

**Replacement proposal (static + Actions cron):**
- Scaffold: `bun create vite nsmt-dashboard --template react-ts` (or pure vanilla if no React needed — the prototype is vanilla)
- GitHub Actions workflow `fetch-projects.yml`:
  - Schedule: `cron: '17 * * * *'` (hourly, offset to avoid top-of-hour rush)
  - Uses `gh api` or Octokit in a Node script
  - Writes `public/data.json` with shape `{ fetchedAt, projects: [...], errors: [...] }`
  - Commits to `main` if changed
- Frontend reads `/data.json` on load (fetch with `if-modified-since`)
- Deploy: any static host (Cloudflare Pages, GitHub Pages, Netlify)
- Token lives in GitHub Actions secret — never in browser, never in Vercel env

**What this keeps:** Every UX feature in the design (theme, focus band, ghost cards, filters, search, present mode, drift signal). None of those require server rendering.

**What this changes:** Ghost-card "Save" can't commit `data.json` from the browser; the flow becomes localStorage-only per-device. See D6 for resolution: ghost-card save writes to **localStorage** in SPA mode; the user commits to `projects.json` manually when they want cross-device persistence. This is acceptable for a one-user dashboard.

**Verdict I'd ask Codex to check:** is there a reason Next.js 16 is the right call here that I'm missing? If David's goal is "learn Next 16," that's valid but should be named. If the goal is "ship the dashboard," static is faster and cheaper.

### D2: Live GitHub API on page load — recommend pre-fetched JSON OR robust route handler

**What the plan currently says:** Server component calls Octokit in RSC, `revalidate = 3600`.

**Nine unhandled failure modes:**

| # | Scenario | Current behavior | Needed |
|---|---|---|---|
| F1 | Rate limited (429) | Route throws, page 500 | Catch, return last-known-good `data.json`, show banner |
| F2 | API down / 5xx | Route throws, page 500 | Same as F1 |
| F3 | Token expired / revoked (401) | Route throws | Same as F1 + log to console so owner notices |
| F4 | Malformed response | Uncaught parse error | Schema-validate (zod) |
| F5 | Seeded repo renamed / deleted | Octokit 404 per repo | Filter gracefully, surface in `errors[]` |
| F6 | Private repo + public-scope token | Silently missing | Detect & warn once on first fetch |
| F7 | >100 repos | Pagination unhandled | Use Octokit paginate or filter to known list |
| F8 | Forks of other repos | Appear in grid | Filter `fork === false` |
| F9 | Waterfall latency on ISR miss | 1–3s TTFB on the unlucky request | Parallelize `listCommits` calls with `Promise.all` |

**Replacement proposal (preferred, aligns with D1):** GitHub Actions writes `data.json`. Frontend reads it. F1–F9 either don't apply (no runtime fetch) or are logged in the Actions run (F2, F3, F4) and leave the previous `data.json` on disk.

**Alternative (if Next.js stays):** Move fetch out of the page server component into `/api/projects` route handler. Implement all nine cases. Add an in-memory 5-min cache + CDN 60-min cache. On any non-2xx from GitHub, serve `lib/last-known-good.json` (committed to repo). This is a real engineering task, not a one-liner.

### D3: Both layout variations + floating toggle — recommend ship A only

**What the plan currently says:** Both `FocusBandA` (broadcast bar) and `FocusBandB` (editorial hero), floating toggle, `html.variation-a|b` class.

**Why it's the wrong call:**
1. **2× components, CSS, and motion rules** for a feature only one person uses.
2. **Variation B is already hidden on mobile** (plan step 8). So you're shipping its DOM+CSS to mobile clients who can't see it. That's a red flag.
3. **The toggle is a design-tool artifact.** It existed to A/B concepts during design iteration. Shipping it is shipping the workshop floor.
4. **Default is A** per `TWEAK_DEFAULTS.variation = 'a'` (prototype line 1146). There's an implicit preference already; the toggle is mostly theater.
5. **RSC + toggle = both variations in the DOM always.** No code splitting between them without custom work.

**Replacement proposal:**
- Ship `FocusBandA` only. Delete `FocusBandB`, `VariationToggle`, the `html.variation-a|b` classing, and the second grid render (`renderGrid(document.getElementById('grid-b'))` — prototype line 1384).
- Give David 1 week with Variation A in production. If he wants to evaluate B, restore the CSS from the prototype HTML (it's still archived in `/tmp/design-peppy-moth/`) and try it locally behind a URL param.
- Keep the two-card focus pattern — that's the feature, not the toggle.

**Impact on rest of plan:** Step 5 renders one focus band. Step 6 drops `FocusBandB`, `VariationToggle`. Step 8 simplifies (no "Variation B hidden on mobile"). CSS port halves.

---

## Prerequisites (before implementation starts)

The target directory doesn't exist yet. First step of implementation depends on D1 outcome:

```bash
# If keeping Next.js (current user choice):
mkdir -p ~/NSMT/nsmt-dashboard && cd ~/NSMT/nsmt-dashboard && git init
bunx create-next-app@16 . --ts --tailwind --app --src-dir --import-alias "@/*"

# If switching to Vite SPA (round-1 recommendation):
mkdir -p ~/NSMT/nsmt-dashboard && cd ~/NSMT/nsmt-dashboard && git init
bun create vite . --template react-ts
```

`git init` is required before the scaffold so standard dev-workflow commits work from day one.

**Note on bun vs npm:** user has bun installed (per global CLAUDE.md). Prefer `bun` for local; Next.js dev on Mac M-series is faster under bun. CI (GitHub Actions) can stick to npm/node to avoid bun version drift.

---

## Target location (assumes Next.js path kept; adjust if D1 flips to Vite)

```
~/NSMT/nsmt-dashboard/
├── public/
│   ├── assets/              ← copied from design bundle
│   │   ├── wordmark-black.png
│   │   ├── wordmark-blue.png
│   │   ├── wordmark-white.png
│   │   └── secondary-blue.png
│   └── last-known-good.json ← fallback for GitHub API failures (D2)
├── src/
│   ├── app/
│   │   ├── layout.tsx       ← Rubik + JetBrains Mono, no-flash theme script
│   │   ├── page.tsx         ← server component, reads from /api/projects
│   │   ├── api/
│   │   │   └── projects/route.ts  ← GitHub fetch with full F1–F9 handling
│   │   ├── error.tsx        ← D10: route error boundary
│   │   ├── loading.tsx      ← D10: skeleton
│   │   └── globals.css      ← CSS tokens (light + absolute-black dark)
│   ├── components/
│   │   ├── Topbar.tsx
│   │   ├── FocusBand.tsx             ← D3: one, not two
│   │   ├── PriorityBecause.tsx       (contenteditable + localStorage)
│   │   ├── FilterBar.tsx
│   │   ├── ProjectGrid.tsx
│   │   ├── ProjectCard.tsx           (active/in-progress/paused/shipped states)
│   │   ├── GhostCard.tsx
│   │   ├── SetupForm.tsx
│   │   ├── NewProjectCard.tsx        (D9: UI-only, toast on click)
│   │   ├── HelpPopover.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── PresentToggle.tsx
│   ├── hooks/
│   │   └── usePersistedState.ts
│   ├── lib/
│   │   ├── github.ts                 (Octokit fetcher — server only)
│   │   ├── projects.ts               (PROJECT_META map)
│   │   ├── drift.ts                  (>60 day stale check on default branch)
│   │   ├── isoWeek.ts                (D7: ISO-8601 week helpers)
│   │   ├── schema.ts                 (D2/F4: zod schemas for GitHub responses)
│   │   └── utils.ts                  (cn() helper)
│   └── types.ts                      (Project, RepoMeta, Status, Type)
├── .env.local                        ← GITHUB_TOKEN, GITHUB_OWNER=thensmt
├── components.json                   ← shadcn config
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Removed from previous plan:**
- `FocusBandA.tsx` and `FocusBandB.tsx` → single `FocusBand.tsx` (D3)
- `VariationToggle.tsx` (D3)
- `BarberPoleRail.tsx` (D9: CSS-only in prototype, not a component)

---

## Implementation steps

### 1. Scaffold the project
- `bunx create-next-app@16 nsmt-dashboard --ts --tailwind --app --src-dir --import-alias "@/*"`
- `cd nsmt-dashboard && bunx shadcn@latest init` (use `neutral` base, CSS variables on)
- Install: `@octokit/rest`, `lucide-react`, `clsx`, `tailwind-merge`, `zod`
- Add shadcn primitives: `button`, `input`, `badge`, `popover` (**dropped `dialog`** — D9: nothing uses it)

### 2. Copy assets
- `cp /tmp/design-peppy-moth/david-dashboard/project/assets/*.png public/assets/`
- Use `next/image` for wordmark in `Topbar.tsx`

### 3. Port design tokens → `src/app/globals.css`
- Lift the two `:root` / `html.dark` blocks from `/tmp/design-peppy-moth/david-dashboard/project/David Dashboard.html` **lines 11–54** verbatim.
- **D11 addition:** update `tailwind.config.ts` `theme.extend.colors` to reference the CSS vars, so `bg-[var(--surface)]` and `bg-surface` both work. Every CSS token in the `:root` block gets a corresponding Tailwind color entry.
- Rubik + JetBrains Mono loaded via `next/font/google` in `layout.tsx` (replaces prototype's `<link>` preconnect approach). **Note:** next/font requires network at build time — CI needs unblocked Google Fonts access.

### 4. Data layer — `src/lib/github.ts` + `src/lib/projects.ts` + `src/app/api/projects/route.ts`
- `projects.ts` exports a `PROJECT_META` map keyed by repo slug. Seed from prototype's `PROJECTS` array at **line 1153** (corrected from ~1140, D4). Structure: `{ type, status, desc, next, stack, live, path }`.
- `github.ts` exports `async function fetchProjects()`:
  1. `octokit.repos.listForOrg({ org: 'thensmt', per_page: 100 })` (D2/F7: one page is enough for <100 repos; add paginate wrapper if it ever exceeds).
  2. Filter: `!repo.fork && !repo.archived` (D2/F8 + D8).
  3. `Promise.all` per repo: `octokit.repos.listCommits({ owner, repo, sha: repo.default_branch, per_page: 1 })` (D2/F9 parallelize, D8 default branch).
  4. Merge with `PROJECT_META`; repos not in meta → ghost cards.
  5. Compute `drift: boolean` via `drift.ts`: `lastCommit && daysSince(lastCommit) > 60`. Repos with no commits → `drift: false` + `noCommits: true`.
  6. Return shape: `{ fetchedAt: ISO, projects: Project[], errors: Array<{repo, error}> }`.
- `schema.ts` (D2/F4): zod schema for each GitHub response type; parse before using.
- `api/projects/route.ts` (D2 hardening):
  - Wraps `fetchProjects()` in try/catch.
  - On success: returns data, writes copy to `public/last-known-good.json` (via fs write, one-shot).
  - On failure: reads `public/last-known-good.json` as fallback, adds `stale: true, error: '...'` field.
  - Cache-Control: `s-maxage=3600, stale-while-revalidate=86400`.
  - **CAVEAT (flagged for Codex):** Vercel serverless FS is read-only. `fs.writeFile` to `public/` won't work on Vercel. Alternatives: Vercel KV, Edge Config, or commit-via-GH-Action. Must be resolved before implementation if Vercel is the host.
- `page.tsx` fetches from `/api/projects` (server-to-server, no client token exposure). ISR via `revalidate = 3600` on `page.tsx`.
- **Resolves D1 contradiction by naming the truth:** the dashboard is **"live to the last hour"**, not "live on every request." Present mode + reload is the way to force-refresh.

### 5. Build the page shell
`src/app/page.tsx` (server component):
```
<Suspense fallback={<Skeleton />}>
  <Topbar />
  <FocusBand projects={focused} />           {/* D3: one band */}
  <PriorityBecause />
  <FilterBar />
  <ProjectGrid projects={all} />
  <HelpPopover />
</Suspense>
```
- `app/error.tsx` and `app/loading.tsx` for graceful states (D10).
- Focused projects: first two where `status==='Active'`, fallback to `status==='In Progress'`.

### 6. Port each component
Match the prototype's DOM and class structure where it makes the CSS port easier; use Tailwind arbitrary values + CSS variables so the light/dark tokens work unchanged. Key behaviors:

- **Topbar:** wordmark (white logo on black), meta (`NSMT · Projects · Week 16 · Apr 19, 2026`), search (`⌘K` to focus), present toggle, help `?`, theme toggle, avatar. Week number comes from `isoWeek.ts` (D7).
- **Focus band barber pole:** diagonal blue/white stripes scrolling downward, 2s cycle (3s on mobile), respects `prefers-reduced-motion`. **CSS-only** — `.focus-card-side` background animation (D9). Not a component.
- **ProjectCard:** 4 status variants. Active = `#0D0D0D` bg + 3px solid blue left border. Shipped = 88% opacity + 60% desaturate + diagonal "SHIPPED" watermark at 5% opacity + blue ribbon corner + checkmark chip. Paused = 72% opacity + 55% grayscale (restored on hover). In-progress = normal card + blue "In Progress" chip.
- **GhostCard → SetupForm:** click "Configure →" replaces ghost with in-grid setup form. 4 fields: Type (button group), Status (button group), Description (120-char max with counter), Next action. Save disabled until all filled.
  **D6 persistence spec:** on save, write to `localStorage['nsmt-project-overrides']` as `{ [repoId]: { type, status, desc, next, configuredAt } }`. On next page load, a client-side effect merges overrides into the server-rendered project list. **This is intentionally client-only and single-device** — acceptable for a one-user dashboard. Cross-device persistence requires either: (a) committing a diff to `projects.ts`, or (b) adopting the Actions-cron architecture (D1) where overrides become a JSON file the user commits. **Flagged as deferred decision.**
- **Filters:** non-matching cards fade to 25% opacity + slight desaturate; matching cards 1.01x scale pulse.
- **Search:** real-time filter by name/commit/stack, case-insensitive.
- **PresentMode:** toggles `html.present` class → CSS hides local path, commit row, next-action bar, drift underlines, help button, priority-because, ghost/setup/new-project cards; dims filter bar to 35%; adds "NSMT PROJECTS" portfolio header. Persisted to `localStorage['nsmt-present-mode']`.
- **ThemeToggle:** moon/sun, persists `localStorage['nsmt-theme']`. **No-flash guard:** an inline `<script>` (children-as-string, not attribute-based; see Next.js docs for the Script component with `strategy="beforeInteractive"`) reads `localStorage['nsmt-theme']` and adds `dark` class to `<html>` before React hydrates. Non-trivial under Next 16 / React 19 — confirm the chosen approach renders before hydration and doesn't cause mismatches. **Flagged for Codex to double-check.**
- **PriorityBecause (D7 spec):**
  - `isoWeek.ts` exports `currentIsoWeekKey()` returning e.g. `'2026-W16'`.
  - Storage key: `nsmt-priority-because-2026-W16`.
  - On week rollover (Monday 00:00 local): new key, field renders blank. **Intentional** — the weekly reset is the feature; the ADHD anchor shouldn't carry last week's note.
  - On load, iterate all `nsmt-priority-because-*` keys; delete any older than 8 weeks.

### 7. Motion layer
Port keyframes from prototype **lines 739–905** into `globals.css` (confirmed accurate).
- Topbar clip-path sweep on load (300ms)
- Focus band scanline (700ms, left→right, fades)
- Focus cards stagger rise (420ms, 520ms delays)
- Grid cards stagger rise (60ms increments from 640ms base; shipped cards skip)
- Hover lift −3px + blue glow shadow (150ms)
- Active chip pulse ring (every 3s, scale 1→1.28)
- Ghost card marching dashes (8s loop)
- Full `@media (prefers-reduced-motion: reduce){ *,*::before,*::after{animation:none!important;transition:none!important} }` escape hatch (already in prototype line 903).

### 8. Responsive
- `@media (max-width: 980px)`: focus-card sidecar collapses to horizontal row.
- `@media (max-width: 640px)`: single-column grid, horizontal scroll focus band, scroll-snap carousel with "01 / 02" indicator, collapsible search icon, hidden local path, filter bar horizontal scroll, all motion durations halved.
- **D3: no "Variation B hidden on mobile"** — B doesn't ship.

### 9. README
Short readme covering: GitHub token creation (`repo` scope, classic PAT or fine-grained), `.env.local` placement, how to add a tracked repo (edit `projects.ts`), local run (`bun dev`), deploy (Vercel + env var), how GitHub API failures degrade (last-known-good fallback), how to clear localStorage overrides.

---

## Critical files to reference during implementation (D4 corrections)

| Concern | File | Lines (verified) |
|---|---|---|
| CSS tokens (light + dark) | `/tmp/design-peppy-moth/david-dashboard/project/David Dashboard.html` | **11–54** ✓ |
| Topbar markup | same | scan for `.topbar` class (~60–85) |
| Focus band A (keep) | same | scan for `.focus-band`, `.focus-card-a` |
| Focus band B (drop, for reference) | same | scan for `.focus-card-b` |
| Card states | same | scan for `.card`, `.card.active`, `.card.shipped`, `.card.paused` |
| Motion keyframes | same | **739–905** ✓ |
| Responsive rules | same | ~655–737, 877–900 |
| PROJECTS data array | same | **1153–1239** (was incorrectly listed as ~1140, D4) |
| `cardHTML()` renderer | same | **1268–1292** ✓ |
| `ghostCardHTML()` | same | **1316–1331** |
| `setupCardHTML()` | same | **1333–1372** |
| `validateSetup()` | same | **1472–1478** (6 lines, was incorrectly 1472–1486, D4) |
| Filter/search handlers | same | **1386–1495** |
| Chat transcript (intent) | `/tmp/design-peppy-moth/david-dashboard/chats/chat1.md` | full |

---

## Verification

1. **Run locally:** `cd ~/NSMT/nsmt-dashboard && bun dev` → `http://localhost:3000`.
2. **Visual parity check:** open prototype `file:///tmp/design-peppy-moth/david-dashboard/project/David%20Dashboard.html` alongside localhost:3000. Compare at 1440px, 980px, 375px.
3. **Interactions:**
   - Theme toggle flips to absolute black (no gray bleed anywhere)
   - Filter chips fade non-matching cards
   - Search filters in real time across name/commit/stack
   - `⌘K` focuses search
   - Help `?` opens popover, click-outside closes
   - Priority-because field saves text and restores on reload within the same ISO week
   - Priority-because blanks on ISO-week rollover (confirm by setting system clock forward a week OR stub `currentIsoWeekKey()` in a dev build)
   - Present mode hides commit/path/next-action/help/priority-because and shows "NSMT PROJECTS" header
   - Ghost card → Configure → fill 4 fields → Save → snapIn animation → localStorage override persists on reload
4. **GitHub data (D2 failure-mode verification — add these to CI as manual checks):**
   - ✅ Happy path: hard-reload with `GITHUB_TOKEN` set → cards show real commit SHA + message + timestamp.
   - ✅ **F1 (rate limit):** temporarily set `GITHUB_TOKEN=''` → fetch falls back to `last-known-good.json` + banner.
   - ✅ **F3 (bad token):** set `GITHUB_TOKEN='invalid'` → same fallback.
   - ✅ **F5 (renamed repo):** add a bogus entry to `PROJECT_META` → card shows with an error chip, no crash.
   - ✅ **F8 (forks):** confirm none of David's forks (e.g. dotfiles forks) appear.
   - ✅ **Fixture fallback:** in dev mode, `NSMT_USE_FIXTURE=1 bun dev` reads `__fixtures__/repos.json` instead of GitHub, so verification is reproducible offline.
5. **Motion:** page load in a fresh tab — topbar sweep, focus scanline, staggered card rise, hover lift, barber pole running on focus-card left rails. Toggle OS-level "reduce motion" → animations stop.
6. **Mobile:** Chrome DevTools iPhone emulation → focus band becomes horizontal scroll carousel with indicator, search collapses to icon, local paths hidden.
7. **Error boundary (D10):** throw in the RSC fetch path (devtools breakpoint or a `throw` in `fetchProjects`) → `error.tsx` renders, no white-screen.

**Done when:** all seven verification groups pass AND the prototype + implementation look identical in side-by-side screenshots at all three breakpoints.

---

## Deferred decisions (require user or Codex sign-off)

These cannot be unilaterally resolved by the round-1 reviewer:

1. **D1 (scaffold):** Next.js 16 or Vite SPA + Actions cron?
2. **D2 (data):** Route-handler + last-known-good, or Actions-cron JSON?
3. **D3 (layouts):** Ship both or just Variation A?
4. **D6 (ghost-card persistence):** localStorage-only, or commit-to-projects.json flow? Depends on D1.
5. **Hosting:** Vercel, Cloudflare Pages, or GitHub Pages? (Matters only for Next.js path; static options open up with D1 Vite choice.)
6. **Token scope:** classic PAT with `repo` scope, or fine-grained token with read-only on `thensmt/*`? Fine-grained is safer but requires one-per-repo configuration.
7. **Vercel read-only FS:** the `api/projects/route.ts` proposal writes `last-known-good.json` back to disk on success. This won't work on Vercel serverless. Need Vercel KV, Edge Config, or a bundled-at-build-time fallback. Codex should resolve.

---

## Handoff to round 2 (Codex)

**Stage:** DEVELOP (post-adversarial review, pre-implementation).

**Runtime context:**
- Repo: `/Users/david/NSMT/nsmt-dashboard/` (only `PLAN.md`, `README.md`, `.git/` present).
- Design bundle: `/tmp/design-peppy-moth/david-dashboard/` (HTML prototype at `project/David Dashboard.html`, 1647 lines).
- User: David (NSMT / Nova Sports Media Team), one-user dashboard, personal use.
- No npm deps installed yet — scaffold is blocked pending D1 resolution.

**What Claude (round 1) claims:**
- Three disagreements with the user's decisions: scaffold (D1), data source (D2), layout count (D3).
- Nine GitHub API failure modes unhandled in the original plan (D2 table).
- Line-reference errors (D4/D5): PROJECTS at 1153 not ~1140; `validateSetup` 1472–1478 not 1472–1486.
- Seven deferred decisions listed.

**What Codex should do (round 2):**
1. **Stress-test Claude's pushback.** Am I being too aggressive on D1? Is Next.js 16 actually the right call for reasons I dismissed (learning goal, future extensibility, team familiarity)? Is the static+cron architecture I recommend genuinely simpler, or am I hiding complexity in GitHub Actions YAML?
2. **Stress-test what Claude missed.** What new failure modes, hidden costs, or wrong premises did round 1 overlook? Specifically look at:
   - The ghost-card setup-form persistence story (D6) — is localStorage-only actually acceptable or a footgun?
   - The no-flash theme script (does it actually work in Next 16 RSC without hydration mismatch?)
   - The ISO-week priority-because eviction (is 8 weeks the right threshold?)
   - The `last-known-good.json` write-from-route-handler (safe on Vercel read-only FS? Flagged as a blocker).
   - Whether dropping Variation B actually maps to the chat transcript's original intent — has David signaled he'd miss it?
3. **Propose concrete edits to PLAN.md.** Either accept Claude's changes, reject them, or amend. Be specific: file, section, new text.
4. **Do not rewrite PLAN.md in place.** Write findings to `.review/CODEX_FINDINGS.md` so round 2 Claude can synthesize.

**Prompt for Codex:** see `.review/CODEX_PROMPT.md`.

---

*Round 1 rewrite complete. 2026-04-19. Changed sections: findings summary (new), context (trimmed), architectural disagreements D1–D3 (new detailed sections), implementation steps 1–6 (edits per findings), critical files table (line refs corrected), verification (F1–F9 cases added), deferred decisions (new), handoff (new).*
