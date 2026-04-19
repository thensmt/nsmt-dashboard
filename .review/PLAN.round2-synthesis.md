# NSMT Dashboard — Implementation Plan

> **Reviewers:** Round 1 — Claude (Opus 4.7, adversarial). Round 2 — Codex. Round 2 synthesis — Claude.
> **Status:** Adversarial review complete. Six items require user sign-off before implementation starts (see "Deferred decisions").

---

## What changed between rounds

This plan went through three adversarial passes. The short story:

- **Round 1 (Claude, adversarial)** pushed back on all three of the user's architectural choices (Next.js 16, live GitHub API, both layouts), found 12 unflagged issues, and proposed sweeping rewrites.
- **Round 2 (Codex, adversarial on round 1)** agreed Round 1 was right about GitHub failure handling, line refs, drift scoping, and error boundaries — but rejected Round 1's instinct to overrule the user on architecture and layouts. Codex also surfaced 13 new findings Round 1 missed, most importantly that Round 1's own `/api/projects` proposal writes to a read-only Vercel filesystem and won't work as described.
- **Round 2 synthesis (this document)** keeps Round 1's failure-mode hardening, reverses Round 1's overcorrections on D1/D3/D6/D9/D11, adopts Codex's new findings, and leaves six items for the user to decide.

A detailed table follows.

---

## Synthesis: every finding, decision, and reasoning

| ID | Topic | Round 1 said | Round 2 (Codex) said | Synthesis (this doc) | Reason |
|---|---|---|---|---|---|
| D1 | Scaffold: Next.js 16 vs Vite+Actions | Recommend static + Actions cron | Keep Next.js as baseline; static is alt | **Keep Next.js 16 as baseline. Static is documented alternative.** | User picked Next.js 16. Round 1's counter-proposal adds remote+workflow+commit-flow complexity. Respecting user choice unless they opt-in to alternative. |
| D2 | Data: live API vs pre-fetched JSON | Pre-fetched JSON | Keep failure hardening; fix the broken Vercel write-back | **Keep F1–F9 hardening. Drop runtime `fs.writeFile`. Use committed `public/data.json` fallback updated by optional GH Action.** | F1–F9 are real and unaddressed in original plan. Round 1's own fallback contradicted Vercel's read-only FS. Codex's committed-fallback fix is the right middle path. |
| D3 | Layouts: both vs A only | Ship A only | Reject — chat transcript shows user explicitly asked for both | **Ship both. Toggle persists. Render one grid; swap only the focus band. Mobile stays A-only (per prototype).** | Chat transcript line 234–244: user said *"I love the Editorial hero variation"* and asked to render both "side by side or as a toggle." Round 1 overruled a direct user preference without reading the chat. Reverting. |
| D4 | Line refs drift | PROJECTS at 1153 (not ~1140); `validateSetup` 1472–1478 (not 1472–1486) | Confirmed | **Corrected inline.** | Mechanical fix. |
| D5 | GitHub owner | "`thensmt` confirmed" | Slug confirmed, account type (User vs Org) unverified | **`thensmt` slug confirmed. Account type must be detected at runtime via `GET /users/thensmt` and branched to `listForOrg` or `listForUser`.** | Round 1 overreached. `listForOrg` vs `listForUser` is a different API call; guessing wrong 404s the fetch. |
| D6 | Ghost-card save persistence | localStorage-only, single-device | Footgun — user said "never require a code change" | **Two-track: (a) localStorage writes a `drafts` entry with clear "local only" UI state, AND (b) export-as-JSON that the user commits to `projects-overrides.json`. v1 ships both.** | Chat line 400: *"This is critical — the dashboard should never require a code change when I start a new project."* Round 1's per-device-only fails that requirement. Draft + export is the smallest durable solution. |
| D7 | Priority-because ISO-week keying | Blank on Monday rollover; weekly eviction | Not confirmed design intent; prototype uses `nsmt-pb-a/b` keys, not per-week | **Single key: `nsmt-priority-because`. User writes/edits at any time. No week rollover behavior. If user wants to "reset Monday," they clear the field.** | Chat line 238: user said *"I write my own reason on Monday so I can read it when I lose focus mid-week."* Writing on Monday is a **behavioral act**, not a storage schema. Round 1 over-engineered. |
| D8 | Drift signal spec | Default branch only; ignore archived; noCommits handled separately | Confirmed — matches `#help-popover` text at prototype line 1138 | **Kept.** | Good as-is. |
| D9 | `+ New Project` card | Toast-only UI | Must open setup form (with `manual: true`) | **Opens inline setup form (same component as ghost→setup), with `manual: true` flag so GitHub-derived fields are absent.** | Chat line 415 + assistant's own note at line 490: *"in production it'd open the same setup form pre-flagged as manual."* Prototype ships toast because it's a static demo; we're not shipping a static demo. |
| D10 | Error boundary, Suspense, skeleton | Add `error.tsx` + `loading.tsx` | Confirmed | **Kept.** | Good as-is. |
| D11 | Tailwind token mapping | Map every CSS token to Tailwind colors | Overmapping; prototype tokens include non-color semantic vars | **CSS variables remain primary source of truth. Tailwind arbitrary values (`bg-[var(--surface)]`) are the default. Map only the 3–4 most frequently used semantic colors to named Tailwind tokens for ergonomics.** | Round 1 overcorrected. `--mono`, `--focus-card-bg`, `--next-action-bg` don't fit `theme.extend.colors` cleanly. |
| D12 | Verification: need fixture data | Add `__fixtures__/repos.json` for offline verify | Confirmed | **Kept.** | Good as-is. |
| **New: C1** | Vercel fallback design is broken | — | Route handler writes `public/last-known-good.json` on success — Vercel serverless FS is read-only | **Adopted:** `public/data.json` is a committed artifact. Route handler **reads** it on failure but never writes it. If the user opts into Actions cron (D1 alt), the same `public/data.json` is the cron's output. If not, it's updated manually or via a simple `bun run fetch` script the user invokes periodically. |
| **New: C2** | "Reload to force-refresh" was false | — | ISR + route handler means a browser reload hits the cached render | **Adopted:** `/api/projects?refresh=1` bypasses cache (`cache: 'no-store'`). Add a "Refresh" button in Topbar that calls it and reloads. Plain reload stays ISR'd. |
| **New: C3** | No-flash theme script needs real spec | — | Inline-script-before-hydration in Next 16 / React 19 has hydration pitfalls | **Adopted:** use Next.js `<Script strategy="beforeInteractive">` wrapping a string that reads `localStorage['nsmt-theme']` and toggles `<html class="dark">`. Set `suppressHydrationWarning` on `<html>` (standard pattern for theme scripts — narrowly scoped, not a general escape hatch). Add a test that runs `next build && next start` and checks no hydration warning in console. |
| **New: C4** | `thensmt` account type unverified | — | `gh api /users/thensmt` needed | **Deferred decision for user** — or verified at first run of the dashboard via a one-time `GET /users/thensmt` and cached. See Deferred Decision #5 below. |
| **New: C5** | PriorityBecause shared-state across layouts | — | Both variations must share one priority key, not per-variation | **Adopted:** single `nsmt-priority-because` key, one component instance that renders in the active focus band. Editing in either layout reflects in the other. |
| **New: C6** | `Week 16 · Apr 19, 2026` is hardcoded twice | — | Topbar + Present-mode header both hardcode the string | **Adopted:** both surfaces read from `isoWeek.ts` (`currentIsoWeekLabel()` → `'Week 16 · Apr 19, 2026'`). One function, two call sites. |
| **New: C7** | Client-side override merge can flash | — | Ghost card renders from server data, then flashes to configured after hydration | **Adopted:** before the page's RSC renders, a small client-layer `<script>` injects a pre-hydration merge from `localStorage['nsmt-project-overrides']` into a global object the server render reads via a hydration-safe pattern. **OR** accept the flash and document it as a known limitation for v1. Recommend the latter — pre-hydration injection complicates the critical render path; the flash is <50ms and only affects newly-configured repos. |
| **New: C8** | Filter-dim selector in prototype is stale (`.filter-bar` vs actual `.filters`) | — | Port the intent, not the selector | **Adopted:** dim `.filters` in present mode. Do not blindly copy prototype's `.filter-bar` rule. |
| **New: C9** | Infinite motion needs second-level control | — | Barber pole, active-chip pulse, ghost marching dashes all loop forever | **Adopted:** `prefers-reduced-motion` remains the hard stop. Add a "Quiet motion" toggle to settings (accessible via help popover) that disables infinite loops but keeps one-shot animations. |
| **New: C10** | Present-mode persistence | — | Should be an explicit choice | **Adopted:** present mode is **session-only** (not persisted). Reasoning: the only time you enter present mode is for a live screenshare; leaving it on after the call ends is a footgun (you open the dashboard the next morning and your data is hidden). Prototype persistence was a demo convenience. |
| **New: C11** | `last-known-good` path was inconsistent | — | Tree had `public/last-known-good.json`; D2 text had `lib/last-known-good.json` | **Adopted:** unified to `public/data.json`. Fallback AND happy-path read the same file. Same shape. No `last-known-good.json` anywhere. |
| **New: C12** | Don't port prototype's configured-card field-name bugs | — | Prototype save-handler writes `repoUrl`/`liveUrl`/`commit.date`, but `cardHTML()` reads `github`/`live`/`commit.ts` | **Adopted:** preserve **visual behavior** (snap-in animation, card shape) but use the typed `Project` interface consistently. Don't port the prototype's undefined-ref bug. |

---

## Reviewer directive: adopt an adversarial stance

**To any reviewer (Ultraplan, Codex, human) reading this plan:** don't validate — stress-test. Your job is to find what's wrong, missing, over-engineered, or load-bearing but unstated. Specifically look for:

- **Failure modes:** what breaks when GitHub API is down, rate-limited, returns malformed data, or the token expires?
- **Unstated assumptions:** what does this plan silently rely on that might not hold?
- **Scope creep vs. under-scoping:** what's being built that wasn't asked for? What's being skipped that should be in scope?
- **Simpler alternatives:** where does this plan do something complex when a simpler thing would work?
- **Edge cases:** repos with no commits, repos archived/deleted, forked repos, private repos the token can't see, >100 repos requiring pagination
- **Wrong premises:** is the design itself actually solving the right problem?
- **Hidden costs:** maintenance burden, auth token rotation, deploy complexity
- **The "simplest thing that makes this wrong" question:** what's the most likely way this implementation will fail David a month after launch?

**Don't be polite.** If the approach is flawed, say so and propose a replacement. If the plan is fine as-is, say that explicitly — but only after actively trying to break it.

---

## Context

David needs a personal projects dashboard to track all his NSMT (Nova Sports Media Team) work across GitHub repos — active broadcasts (`nsmt-livestream`), the Bitburg marketplace build, tooling, events, and shipped projects. The design was iterated in Claude Design (handoff bundle `peppy-moth`) and is now being implemented as a standalone Next.js 16 app.

**What makes this dashboard different from a generic project list:**
- "This Week's Focus" band surfaces the two projects that matter right now, with an editable "priority because:" field as an ADHD anchor
- Ghost cards for untracked GitHub repos → inline setup form → real card (no page reload, no code change for new repos — see D6)
- Drift signal (amber underline) flags Active/In-Progress repos with no commit on default branch in 60+ days
- Presentation mode one-click strips dev-centric data for screen-sharing with partners
- Absolute `#000000` dark mode and two layout variations (Broadcast bar + Editorial hero) with a persisted toggle

**Decisions carried forward from user:**
- **Target (1a):** New standalone Next.js 16 app at `~/NSMT/nsmt-dashboard`
- **Data source (2b):** Live GitHub API, hourly ISR cache + manual Refresh button for force-refresh (C2)
- **Layout (3a):** Both variations on desktop with persisted toggle; mobile shows Variation A only (matches prototype)

**Design bundle source:** `/tmp/design-peppy-moth/david-dashboard/`
- `README.md`
- `chats/chat1.md` (intent — read this for design rationale)
- `project/David Dashboard.html` (80,395 bytes, 1,647 lines)
- `project/assets/wordmark-*.png`, `secondary-blue.png`

**GitHub owner:** slug = `thensmt` (confirmed from seed data). Account type (User vs Organization) is unverified at planning time — must be detected at runtime via `GET /users/thensmt` or confirmed by user before implementation (see Deferred Decision #5).

---

## Prerequisites (before implementation starts)

The target directory doesn't exist yet. First step of implementation:

```bash
mkdir -p ~/NSMT/nsmt-dashboard
cd ~/NSMT/nsmt-dashboard
git init
bunx create-next-app@16 . --ts --tailwind --app --src-dir --import-alias "@/*"
```

`git init` is required before `create-next-app` so standard dev-workflow commits work from day one.

**bun vs npm:** user has bun installed (per global CLAUDE.md). Use `bun` locally. CI (if added later) can stick to npm/node.

---

## Target location

```
~/NSMT/nsmt-dashboard/
├── public/
│   ├── assets/              ← copied from design bundle
│   │   ├── wordmark-black.png
│   │   ├── wordmark-blue.png
│   │   ├── wordmark-white.png
│   │   └── secondary-blue.png
│   └── data.json            ← committed fallback for GitHub API failures (C1, C11)
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Rubik + JetBrains Mono, no-flash theme script (C3)
│   │   ├── page.tsx                ← server component, reads /api/projects
│   │   ├── api/
│   │   │   └── projects/route.ts   ← Octokit w/ F1–F9 handling, reads public/data.json on failure, never writes
│   │   ├── error.tsx               ← D10 route error boundary
│   │   ├── loading.tsx             ← D10 skeleton
│   │   └── globals.css             ← CSS tokens (light + absolute-black dark)
│   ├── components/
│   │   ├── Topbar.tsx              ← includes Refresh button (C2)
│   │   ├── FocusBandA.tsx          ← broadcast bar
│   │   ├── FocusBandB.tsx          ← editorial hero
│   │   ├── VariationToggle.tsx     ← persists to localStorage; mobile-hidden
│   │   ├── PriorityBecause.tsx     ← single key, shared across A/B (C5)
│   │   ├── FilterBar.tsx
│   │   ├── ProjectGrid.tsx
│   │   ├── ProjectCard.tsx         ← active/in-progress/paused/shipped states
│   │   ├── GhostCard.tsx
│   │   ├── SetupForm.tsx           ← reused by GhostCard AND NewProjectCard (D9)
│   │   ├── NewProjectCard.tsx      ← click opens SetupForm with manual:true
│   │   ├── HelpPopover.tsx         ← now also houses Quiet-motion toggle (C9)
│   │   ├── ThemeToggle.tsx
│   │   └── PresentToggle.tsx       ← session-only, not persisted (C10)
│   ├── hooks/
│   │   └── usePersistedState.ts
│   ├── lib/
│   │   ├── github.ts               ← Octokit fetcher (server only)
│   │   ├── githubOwner.ts          ← runtime account-type detection (D5/C4)
│   │   ├── projects.ts             ← PROJECT_META map, seeded from prototype
│   │   ├── overrides.ts            ← localStorage drafts + export-to-JSON (D6)
│   │   ├── drift.ts                ← >60-day stale check, default branch only (D8)
│   │   ├── isoWeek.ts              ← currentIsoWeekLabel() for Topbar + Present header (C6)
│   │   ├── schema.ts               ← zod schemas for GitHub responses (F4)
│   │   └── utils.ts                ← cn() helper
│   └── types.ts                    ← Project, RepoMeta, Status, Type
├── .env.local                      ← GITHUB_TOKEN
├── components.json                 ← shadcn config
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Implementation steps

### 1. Scaffold the project
- `bunx create-next-app@16 nsmt-dashboard --ts --tailwind --app --src-dir --import-alias "@/*"`
- `cd nsmt-dashboard && bunx shadcn@latest init` (use `neutral` base, CSS variables on)
- Install: `@octokit/rest`, `lucide-react`, `clsx`, `tailwind-merge`, `zod`
- shadcn primitives: `button`, `input`, `badge`, `popover` (**no `dialog`** — D9: unused)

### 2. Copy assets
- `cp /tmp/design-peppy-moth/david-dashboard/project/assets/*.png public/assets/`
- Use `next/image` for wordmark in `Topbar.tsx`

### 3. Port design tokens → `src/app/globals.css`
- Lift the two `:root` / `html.dark` blocks from `/tmp/design-peppy-moth/david-dashboard/project/David Dashboard.html` **lines 11–54** verbatim (D4 confirmed).
- **D11 (amended):** CSS variables stay primary. Use `bg-[var(--surface)]` / `text-[var(--ink-60)]` in components. Map only the 3–4 most-used semantic tokens (`bg`, `surface`, `ink-90`, `blue`) to Tailwind theme colors for ergonomics. Do NOT attempt to map every CSS var.
- Rubik + JetBrains Mono loaded via `next/font/google` in `layout.tsx`. CI needs Google Fonts network access at build time.

### 4. Data layer — `src/lib/github.ts`, `src/lib/githubOwner.ts`, `src/lib/projects.ts`, `src/app/api/projects/route.ts`

- **`projects.ts`** exports `PROJECT_META` map keyed by repo slug. Seed from prototype's `PROJECTS` array at **line 1153** (D4 corrected from ~1140). Fields: `{ type, status, desc, next, stack, live, path }`.

- **`githubOwner.ts`** (D5/C4):
  - At module load (once per server start), `GET /users/thensmt` via Octokit.
  - Cache `{ login, type: 'User' | 'Organization' }` for the process lifetime.
  - Export `listForOwner(octokit, opts)` that dispatches to `listForUser` or `listForOrg` based on cached type.
  - If initial detection fails (e.g., rate limit), fall back to `listForUser` with a console warning and reattempt on next request.

- **`github.ts`** exports `async function fetchProjects()`:
  1. `githubOwner.listForOwner({ per_page: 100 })`. Use `octokit.paginate` if total exceeds one page (F7).
  2. Filter: `!repo.fork && !repo.archived` (F8, D8).
  3. `Promise.all` per repo: `octokit.repos.listCommits({ owner, repo, sha: repo.default_branch, per_page: 1 })` (F9 parallelize, D8 default branch).
  4. Merge with `PROJECT_META`; repos not in meta → ghost cards.
  5. Compute `drift` via `drift.ts`: `lastCommit && daysSince(lastCommit) > 60`. `noCommits: true` for repos with no commits at all (D8).
  6. Return `{ fetchedAt: ISO, projects: Project[], errors: Array<{repo, error}>, ownerType: 'User'|'Organization' }`.

- **`schema.ts`** (F4): zod schemas for repo and commit responses. `parse` before using — throws surface in the route handler's catch.

- **`api/projects/route.ts`** (D2 hardening, C1 fix):
  - Wraps `fetchProjects()` in try/catch.
  - On success: returns data with `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`.
  - On failure: reads `public/data.json` (committed artifact), returns it with `stale: true, error: '...'`.
  - **Does NOT write to disk** (C1: Vercel serverless FS is read-only).
  - Supports `?refresh=1` query (C2): sets `cache: 'no-store'` on the Octokit fetch, bypassing Next.js data cache.

- **`public/data.json`** starts as a committed artifact with the seed `PROJECTS` data (msg/ts nulled, matching prototype's "sync pending" shape). Kept fresh by:
  - **Option A (default):** Manual — user runs `bun run fetch-data` locally, commits the JSON.
  - **Option B (optional):** GitHub Actions hourly workflow commits `data.json` if changed.
  - User can choose later without changing app code.

- **`page.tsx`** fetches from `/api/projects` (server-to-server). ISR `export const revalidate = 3600`.

- **Refresh button (C2):** Topbar "↻" icon calls `router.refresh()` after hitting `/api/projects?refresh=1`. This is the "force-live" path.

### 5. Build the page shell

`src/app/page.tsx` (server component):

```tsx
<Suspense fallback={<Skeleton />}>
  <Topbar onRefresh={...} />
  <VariationProvider>
    <FocusBandA projects={focused} />   {/* visibility via html.variation-a */}
    <FocusBandB projects={focused} />   {/* visibility via html.variation-b */}
    <PriorityBecause />                  {/* single instance, shared across A/B — C5 */}
  </VariationProvider>
  <FilterBar />
  <ProjectGrid projects={all} />         {/* one grid, not two — Codex D3 fix */}
  <HelpPopover />
  <VariationToggle />
</Suspense>
```

- `app/error.tsx` (D10) + `app/loading.tsx` skeleton (D10).
- Focused projects: first two where `status === 'Active'`, fallback to `status === 'In Progress'`.
- `VariationToggle` persists to `localStorage['nsmt-variation']`. Pre-hydration script sets `html.variation-a` or `html.variation-b` before React hydrates, same pattern as the theme script.

### 6. Port each component

Match the prototype's DOM and class structure where it makes the CSS port easier; use Tailwind arbitrary values + CSS variables. Key behaviors:

- **Topbar:** wordmark (white logo on black); meta line from `isoWeek.currentIsoWeekLabel()` (C6: replaces the hardcoded "Week 16 · Apr 19, 2026" at prototype lines 643 and 918); search (`⌘K`); present toggle; help `?`; theme toggle; avatar; **Refresh button (C2).**
- **Focus band barber pole:** CSS-only (`.focus-card-side` animated background gradient — not a component, D9).
- **ProjectCard:** 4 status variants. Active = `#0D0D0D` bg + 3px blue left border. Shipped = 88% opacity + 60% desaturate + diagonal "SHIPPED" watermark + blue ribbon + checkmark chip. Paused = 72% opacity + 55% grayscale (restored on hover). In-progress = normal card + blue "In Progress" chip.
- **GhostCard → SetupForm → ConfiguredCard:** click "Configure →" replaces ghost with inline setup form (no modal). 4 fields: Type (button group), Status (button group), Description (120-char max + counter), Next action. Save disabled until all filled.
  **D6/C7 persistence:**
  - On save, write to `localStorage['nsmt-project-overrides']` under `drafts[repoId]`.
  - Reconciliation: on next page load, a client effect merges `drafts` into the server-rendered list. **Known limitation (C7):** newly-configured ghost cards may briefly show as ghost before the effect runs (~one frame / <50ms). Acceptable for v1; documented.
  - **Export flow:** "Export configured projects" button in the help popover downloads `projects-overrides.json`. User commits it to the repo and removes the draft from localStorage. That's the cross-device / durable path. Spec'd explicitly so the "never requires a code change" requirement is met by the export step being one click.
  - **Do not copy prototype's buggy save-handler field names** (C12) — use the typed `Project` interface (`github`, `live`, `commit.ts`), not the prototype's `repoUrl`/`liveUrl`/`commit.date`.
- **NewProjectCard (D9 corrected):** click opens the **same `SetupForm`** with `manual: true`. GitHub-derived fields (stack, last commit, live URL detection) hidden. User provides name, description, next action. Saves to the same `drafts` store.
- **Filters:** non-matching cards fade to 25% opacity + slight desaturate; matching cards 1.01x scale pulse. **Present-mode dimming targets `.filters` (C8), not `.filter-bar`.**
- **Search:** real-time filter by name/commit/stack, case-insensitive.
- **PresentMode (C10):** toggles `html.present` class. **Session-only** — not persisted. Reload = present mode off.
- **ThemeToggle (C3):** moon/sun, persists `localStorage['nsmt-theme']`. No-flash guarded by a Next.js `<Script strategy="beforeInteractive">` in `layout.tsx` that reads localStorage and toggles the `dark` class on `<html>` before React hydrates. `<html>` gets `suppressHydrationWarning` for this narrow case. Verification: `next build && next start`, open devtools, confirm no hydration warnings.
- **PriorityBecause (D7 simplified, C5 shared):**
  - Single localStorage key: `nsmt-priority-because`.
  - One component instance, shared between Variation A and B (mounted once, rendered where the active band displays it).
  - No ISO-week rollover logic. User writes/edits whenever. Writing on Monday is the user's habit, not the storage schema's job.
- **Quiet motion (C9):** toggle in Help popover. When on, adds `html.quiet-motion` class. CSS:
  ```css
  html.quiet-motion .focus-card-side,
  html.quiet-motion .status-active::after,
  html.quiet-motion .card.ghost {
    animation: none;
  }
  ```
  One-shot animations (topbar sweep, card rise) still run.

### 7. Motion layer

Port keyframes from prototype **lines 739–905** (D4 confirmed) into `globals.css`:
- Topbar clip-path sweep on load (300ms)
- Focus band scanline (700ms, left→right, fades)
- Focus cards stagger rise (420ms, 520ms delays)
- Grid cards stagger rise (60ms increments from 640ms base; shipped cards skip)
- Hover lift −3px + blue glow shadow (150ms)
- Active chip pulse ring (every 3s, scale 1→1.28) — disabled under `.quiet-motion` (C9)
- Ghost card marching dashes (8s loop) — disabled under `.quiet-motion`
- Barber pole (continuous) — disabled under `.quiet-motion`
- `@media (prefers-reduced-motion: reduce)` hard-stops all animation (prototype line 903).

### 8. Responsive

- `@media (max-width: 980px)`: focus-card sidecar collapses to horizontal row.
- `@media (max-width: 640px)`: single-column grid; horizontal scroll focus band with "01 / 02" scroll-snap indicator; collapsible search icon; hidden local path; filter bar horizontal scroll; motion durations halved; **Variation B hidden on mobile** — Variation A only (D3 clarified).

### 9. README

Cover: GitHub token creation (fine-grained, `repo:read` on `thensmt/*`); `.env.local` setup; adding a tracked repo (commit to `projects.ts` OR use the export-overrides flow); local run (`bun dev`); deploy (Vercel + env var); GitHub API failure degradation (serves committed `public/data.json`); Refresh button behavior; how to commit localStorage overrides to `projects-overrides.json` for cross-device persistence.

---

## Critical files to reference during implementation (D4 verified)

| Concern | File | Lines (verified) |
|---|---|---|
| CSS tokens (light + dark) | `/tmp/design-peppy-moth/david-dashboard/project/David Dashboard.html` | **11–54** ✓ |
| Topbar markup | same | ~60–85 (`.topbar`) |
| Focus band A (Broadcast bar) | same | scan for `.focus-band`, `.focus-card-a` |
| Focus band B (Editorial hero) | same | scan for `.focus-card-b` |
| Card states | same | scan for `.card`, `.card.active`, `.card.shipped`, `.card.paused` |
| Motion keyframes | same | **739–905** ✓ |
| Responsive rules | same | ~655–737, 877–900 |
| Hardcoded "Week 16 · Apr 19, 2026" | same | **643** (Present header) + **918** (Topbar) — both become dynamic (C6) |
| PROJECTS data array | same | **1153–1239** (D4 corrected) |
| `cardHTML()` renderer | same | **1268–1292** ✓ |
| `ghostCardHTML()` | same | **1316–1331** |
| `setupCardHTML()` | same | **1333–1372** |
| `validateSetup()` | same | **1472–1478** (D4: 6 lines, not 14) |
| Filter/search/save handlers | same | **1386–1495** (save-handler has field-name bugs — C12, don't port literally) |
| Help popover text (drift signal spec) | same | **1138** |
| Chat transcript (intent) | `/tmp/design-peppy-moth/david-dashboard/chats/chat1.md` | full — **required reading** before implementation |

---

## Verification

1. **Run locally:** `cd ~/NSMT/nsmt-dashboard && bun dev` → `http://localhost:3000`.
2. **Visual parity:** open prototype `file:///tmp/design-peppy-moth/david-dashboard/project/David%20Dashboard.html` alongside localhost:3000. Compare at 1440px, 980px, 375px.
3. **Interactions:**
   - Theme toggle flips to absolute black, no gray bleed, **no hydration warning in production build console (C3)**
   - Variation toggle swaps focus band A ↔ B, persists on reload, pre-hydration script prevents flash
   - Mobile only shows Variation A (D3)
   - Filter chips fade non-matching cards
   - Search filters in real time
   - `⌘K` focuses search
   - Help `?` opens popover (contains Quiet motion toggle — C9)
   - Priority-because field saves text, restores on reload, shared across variations (C5)
   - Present mode hides commit/path/next-action/help/priority-because and shows "NSMT PROJECTS" header; **session-only — reload clears it (C10)**
   - Present-mode dims `.filters` correctly (C8)
   - Ghost card → Configure → fill 4 fields → Save → snapIn animation → localStorage draft persists on reload
   - `+ New Project` card → click → setup form opens with `manual: true` (D9)
   - Help popover → "Export configured projects" → downloads `projects-overrides.json`
   - Refresh button → calls `/api/projects?refresh=1` and reloads page with fresh data (C2)
   - Week/date in Topbar and Present header come from `isoWeek.currentIsoWeekLabel()` (C6)
4. **GitHub data (D2 failure verification):**
   - ✅ Happy path with `GITHUB_TOKEN`
   - ✅ **F1 (rate limit):** set `GITHUB_TOKEN=''` → falls back to `public/data.json` + banner "Showing last-known data"
   - ✅ **F3 (bad token):** set `GITHUB_TOKEN='invalid'` → same fallback
   - ✅ **F5 (renamed repo):** add bogus entry to `PROJECT_META` → error chip on that card, no page crash
   - ✅ **F8 (forks):** confirm no forks appear
   - ✅ **D5/C4 owner type:** log `ownerType` on first fetch — confirm `'User'` or `'Organization'`
   - ✅ **Fixture mode:** `NSMT_USE_FIXTURE=1 bun dev` reads `__fixtures__/repos.json` (offline verify)
5. **Motion:** fresh-tab page load → topbar sweep, focus scanline, staggered card rise, hover lift, barber pole continuous. OS "reduce motion" → animations stop. Quiet-motion toggle → barber pole + chip pulse + marching dashes stop; one-shots still run.
6. **Mobile:** DevTools iPhone → focus band is horizontal-scroll carousel, search collapses, local path hidden, Variation B not rendered.
7. **Error boundary:** force `throw` in `fetchProjects` → `error.tsx` renders, no white screen.
8. **Vercel read-only FS sanity (C1):** deploy to Vercel preview; trigger a GitHub failure; confirm the route serves committed `public/data.json` without attempting any write.

**Done when:** all eight verification groups pass AND prototype vs. implementation are side-by-side-identical at 1440/980/375px.

---

## Deferred decisions (require user sign-off before implementation)

These can't be unilaterally resolved by reviewers. In priority order:

1. **`thensmt` account type** (D5/C4). Runtime detection is spec'd, but a one-line answer from the user saves an API call at startup. Is `thensmt` a GitHub User or a GitHub Organization?
2. **Data-freshness contract** (D2). The plan says hourly ISR + manual Refresh button. User can amend to: (a) per-request live (no ISR), (b) shorter TTL (5 min), or (c) Actions cron writing `public/data.json` (removes runtime GitHub dep entirely). Confirm the hourly-ISR-plus-Refresh model is what's wanted.
3. **`public/data.json` update mechanism** (C1). Manual (`bun run fetch-data` + commit) OR GitHub Actions cron? Affects whether we add the workflow file now or later.
4. **Ghost-card cross-device persistence** (D6). v1 ships localStorage draft + one-click export-to-JSON. Confirm this matches the "never require a code change" requirement, or ask for durable server-side persistence (Vercel KV / Supabase — adds scope).
5. **Token scope.** Classic PAT with `repo` scope, or fine-grained token with read-only on `thensmt/*`? Fine-grained is safer but one-per-repo config.
6. **Hosting.** Vercel (default for Next.js) or Cloudflare Pages / self-hosted? Affects whether `public/data.json` fallback is enough (Vercel read-only FS) or we need a durable store.

---

## Reviewer audit trail

- **`PLAN.original.md`** — pre-review starting plan (210 lines). Archived at `.review/PLAN.original.md`.
- **`PLAN.round1-claude.md`** — Round 1 Claude adversarial rewrite (412 lines). Archived at `.review/PLAN.round1-claude.md`.
- **`CODEX_FINDINGS.md`** — Round 2 Codex adversarial review. Archived at `.review/CODEX_FINDINGS.md`.
- **This `PLAN.md`** — Round 2 synthesis (current, the implementation spec).

*Synthesis complete. 2026-04-19. Round 1 overcorrected on D1/D3/D6/D9/D11; Codex pushback correctly flagged these against the chat transcript (chat1.md:234, 400, 415). Round 1 correctly flagged the nine GitHub failure modes and the line-reference errors, which survive into this plan. Six decisions remain for the user.*
