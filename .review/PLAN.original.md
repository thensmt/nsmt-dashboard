# NSMT Dashboard — Implementation Plan

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

David needs a personal projects dashboard to track all his NSMT (Nova Sports Media Team) work across GitHub repos — active broadcasts (`nsmt-livestream`), the Bitburg marketplace build, tooling, events, and shipped projects. The design was iterated in Claude Design (handoff bundle `peppy-moth`) and is now being implemented as a standalone Next.js 16 app.

**What makes this dashboard different from a generic project list:**
- "This Week's Focus" band surfaces the two projects that matter right now, with an editable "priority because:" field as an ADHD anchor
- Ghost cards for untracked GitHub repos → inline setup form → real card (no page reload, no code change)
- Drift signal (amber underline) flags repos with no commit in 60+ days
- Presentation mode one-click strips dev-centric data (local paths, commits) for screen-sharing with partners
- Absolute `#000000` dark mode and two layout variations (Broadcast bar vs Editorial hero) with a live toggle

**Decisions made with user:**
- **Target (1a):** New standalone Next.js app at `~/NSMT/nsmt-dashboard`
- **Data source (2b):** Live GitHub API on page load
- **Layout (3a):** Both variations (Broadcast bar + Editorial hero) with floating toggle

**Design bundle source:** `/tmp/design-peppy-moth/david-dashboard/` (README.md, chats/chat1.md, project/David Dashboard.html ~80KB, assets/wordmark-*.png)

---

## Prerequisites (before implementation starts)

The target directory doesn't exist yet. First step of implementation:

```
mkdir -p ~/NSMT/nsmt-dashboard
cd ~/NSMT/nsmt-dashboard
git init
```

`git init` is required so Ultraplan / remote review tools and standard dev-workflow commits work from day one. Do this before the `create-next-app` scaffold — create-next-app will populate the dir, and the git repo is already set up to track it.

---

## Target location

```
~/NSMT/nsmt-dashboard/
├── public/
│   └── assets/              ← copied from design bundle
│       ├── wordmark-black.png
│       ├── wordmark-blue.png
│       ├── wordmark-white.png
│       └── secondary-blue.png
├── src/
│   ├── app/
│   │   ├── layout.tsx       ← Rubik + JetBrains Mono, no-flash theme script
│   │   ├── page.tsx         ← server component, fetches GitHub repos
│   │   └── globals.css      ← CSS tokens (light + absolute-black dark)
│   ├── components/
│   │   ├── Topbar.tsx
│   │   ├── FocusBandA.tsx            (broadcast bar)
│   │   ├── FocusBandB.tsx            (editorial hero)
│   │   ├── VariationToggle.tsx
│   │   ├── PriorityBecause.tsx       (contenteditable + localStorage)
│   │   ├── FilterBar.tsx
│   │   ├── ProjectGrid.tsx
│   │   ├── ProjectCard.tsx           (active/in-progress/paused/shipped states)
│   │   ├── GhostCard.tsx
│   │   ├── SetupForm.tsx
│   │   ├── NewProjectCard.tsx
│   │   ├── HelpPopover.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── PresentToggle.tsx
│   │   └── BarberPoleRail.tsx        (animated focus-card left rail)
│   ├── hooks/
│   │   └── usePersistedState.ts
│   ├── lib/
│   │   ├── github.ts                 (Octokit fetcher, 60-min revalidate)
│   │   ├── projects.ts               (per-repo metadata: type, status, next action)
│   │   ├── drift.ts                  (>60 day stale check)
│   │   └── utils.ts                  (cn() helper)
│   └── types.ts                      (Project, RepoMeta, Status, Type)
├── .env.local                        ← GITHUB_TOKEN, GITHUB_OWNER
├── components.json                   ← shadcn config
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md                         (how to run, add a repo, set token)
```

---

## Implementation steps

### 1. Scaffold the project
- `bunx create-next-app@16 nsmt-dashboard --ts --tailwind --app --src-dir --import-alias "@/*"` (or npm)
- `cd nsmt-dashboard && bunx shadcn@latest init` (use `neutral` base, CSS variables on)
- Install: `@octokit/rest`, `lucide-react`, `clsx`, `tailwind-merge`
- Add shadcn primitives: `button`, `input`, `badge`, `popover`, `dialog` (used sparingly — most UI is custom to match prototype exactly)

### 2. Copy assets
- Copy `/tmp/design-peppy-moth/david-dashboard/project/assets/*.png` → `public/assets/`
- Use `next/image` for wordmark in `Topbar.tsx`

### 3. Port design tokens → `src/app/globals.css`
Lift the two `:root` / `html.dark` blocks from `/tmp/design-peppy-moth/david-dashboard/project/David Dashboard.html` lines 11–54 verbatim. Rubik + JetBrains Mono loaded via `next/font/google` in `layout.tsx` (replace prototype's `<link>` preconnect approach).

### 4. Data layer — `src/lib/github.ts` + `src/lib/projects.ts`
- `projects.ts` exports a `PROJECT_META` map keyed by repo slug with: `type`, `status`, `desc`, `next`, `stack`, `live`, `path`. Seeded from the hardcoded `PROJECTS` array in `David Dashboard.html` (around line 1140 — verify exact line when implementing) so the initial list matches the prototype exactly.
- `github.ts` exports `async function fetchProjects()`:
  1. Octokit `repos.listForUser` or `listForOrg` (depending on user's setup — see "Config needed" below)
  2. For each repo, `repos.listCommits({ per_page: 1 })` for latest commit SHA + message + date
  3. Merge with `PROJECT_META`; repos not in meta → ghost cards
  4. Compute `drift: boolean` (>60 days since last commit) via `drift.ts`
- Next.js ISR: `export const revalidate = 3600` on `page.tsx` to cache 1 hour

### 5. Build the page shell
`src/app/page.tsx` (server component): fetch projects, render `<Topbar />` + `<VariationToggle />` + both `<FocusBandA />` / `<FocusBandB />` (toggle visibility via `html.variation-a|b` class, matching prototype) + `<PriorityBecause />` + `<FilterBar />` + `<ProjectGrid />` + `<HelpPopover />`.

### 6. Port each component
Match the prototype's DOM and class structure where it makes the CSS port easier; use Tailwind arbitrary values + CSS variables so the light/dark tokens work unchanged. Key behaviors to preserve:
- **Topbar:** wordmark (white logo on black), meta (`NSMT · Projects · Week 16 · Apr 19, 2026`), search (`⌘K` to focus), present toggle, help `?`, theme toggle, avatar
- **Focus band barber pole** (`BarberPoleRail.tsx`): diagonal blue/white stripes scrolling downward, 2s cycle (3s on mobile), respects `prefers-reduced-motion`
- **ProjectCard:** 4 status variants. Active = `#0D0D0D` bg + 3px solid blue left border. Shipped = 88% opacity + 60% desaturate + diagonal "SHIPPED" watermark at 5% opacity + blue ribbon corner + checkmark chip. Paused = 72% opacity + 55% grayscale (restored on hover). In-progress = normal card + blue "In Progress" chip.
- **GhostCard → SetupForm:** click "Configure →" replaces ghost with in-grid setup form (no modal). 4 fields: Type (button group), Status (button group), Description (120-char max with counter), Next action. Save disabled until all filled. On save, animate `snapIn` (scale .96→1.01→1, 400ms) and add to local state.
- **Filters:** non-matching cards fade to 25% opacity + slight desaturate; matching cards 1.01x scale pulse
- **Search:** real-time filter by name/commit/stack, case-insensitive
- **PresentMode:** toggles `html.present` class → CSS hides local path, commit row, next-action bar, drift underlines, help button, priority-because, ghost/setup/new-project cards; dims filter bar to 35%; adds "NSMT PROJECTS" portfolio header
- **ThemeToggle:** moon/sun, persists `localStorage.nsmt-theme`, flash-of-unstyled-content guarded by inline script in `layout.tsx` that sets `html.dark` before hydration
- **PriorityBecause:** `contenteditable` div, persists to `localStorage.nsmt-priority-because-${week}` (key by ISO week so it resets weekly)

### 7. Motion layer
Port keyframes from prototype lines 739–905 into `globals.css`:
- Topbar clip-path sweep on load (300ms)
- Focus band scanline (700ms, left→right, fades)
- Focus cards stagger rise (420ms, 520ms delays)
- Grid cards stagger rise (60ms increments from 640ms base; shipped cards skip)
- Hover lift -3px + blue glow shadow (150ms)
- Active chip pulse ring (every 3s, scale 1→1.28)
- Ghost card marching dashes (8s loop)
- All animations wrapped in `@media (prefers-reduced-motion: no-preference)`

### 8. Responsive
- `@media (max-width: 980px)`: focus-card sidecar collapses to horizontal row
- `@media (max-width: 640px)`: single-column grid, horizontal scroll focus band (Variation A only, B hidden), scroll-snap carousel with "01 / 02" indicator, collapsible search icon, hidden local path, filter bar horizontal scroll, all motion durations halved

### 9. README
Short readme: how to get a GitHub token (personal access, `repo` scope), where to put it (`.env.local`), how to add a new tracked repo (edit `projects.ts`), how to run locally (`bun dev`), how to deploy (Vercel, add env var).

---

## Config needed from user at implementation time

- **GitHub owner:** personal username vs org? (looks like personal repos — e.g., does `nsmt-livestream` live under `davidgaylor` or a `thensmt` org?)
- **GitHub token:** user provides a PAT at `.env.local`. We'll document but never commit.
- **Initial project metadata:** lift from prototype's `PROJECTS` array; user confirms on first run.

These are runtime/config details, not blockers for the plan.

---

## Critical files to reference during implementation

| Concern | File | Lines |
|---|---|---|
| CSS tokens (light + dark) | `/tmp/design-peppy-moth/david-dashboard/project/David Dashboard.html` | 11–54 |
| Topbar markup | same | ~60–85 (scan) |
| Focus band A + B | same | scan for `.focus-band`, `.focus-card-a`, `.focus-card-b` |
| Card states | same | scan for `.card`, `.card.active`, `.card.shipped`, `.card.paused` |
| Motion keyframes | same | ~739–905 |
| Responsive rules | same | ~655–737, 741–901 |
| PROJECTS data array | same | ~1140 (verify) |
| `cardHTML()` renderer | same | ~1268–1292 |
| `validateSetup()` | same | ~1472–1486 |
| Chat transcript (intent) | `/tmp/design-peppy-moth/david-dashboard/chats/chat1.md` | full |

---

## Verification

1. **Run locally:** `cd ~/NSMT/nsmt-dashboard && bun dev` → open `http://localhost:3000`
2. **Visual parity check:** open prototype `file:///tmp/design-peppy-moth/david-dashboard/project/David%20Dashboard.html` in one browser tab and `localhost:3000` in another; compare side-by-side at 1440px desktop, 980px tablet, 375px mobile
3. **Interactions:**
   - Theme toggle flips to absolute black (no gray bleed anywhere)
   - Variation toggle swaps focus band A ↔ B, persists on reload
   - Filter chips fade non-matching cards
   - Search filters in real time across name/commit/stack
   - `⌘K` focuses search
   - Help `?` opens popover, click-outside closes
   - Priority-because field saves text and restores on reload
   - Present mode hides commit/path/next-action/help/priority-because and shows "NSMT PROJECTS" header
   - Ghost card → click Configure → fill 4 fields → Save → snapIn animation → card renders fully styled
4. **GitHub data:**
   - Hard-reload with `GITHUB_TOKEN` set: cards show real latest commit SHA + message + relative timestamp from `nsmt-livestream`, `bitburg`, etc.
   - Intentionally add a repo to GitHub that isn't in `projects.ts` → it shows as a ghost card
   - Find a repo with no commits in 60 days → confirm amber drift underline appears
5. **Motion:** run through page load in a fresh tab — topbar sweep, focus scanline, staggered card rise, hover lift, barber pole always running on focus-card left rails. Toggle OS-level "reduce motion" and confirm animations stop.
6. **Mobile:** Chrome DevTools iPhone emulation → focus band becomes horizontal scroll carousel with indicator, search collapses to icon, local paths hidden, Variation B hidden.

**Done when:** all six verification groups pass AND the prototype + implementation look identical in side-by-side screenshots at all three breakpoints.
