# Codex Round 2 Prompt — Adversarial review of PLAN.md

**Repo:** `/Users/david/NSMT/nsmt-dashboard/`
**File under review:** `PLAN.md` (round 1 rewrite by Claude, 412 lines)
**Original plan snapshot:** `.review/PLAN.original.md`
**Claude round 1 output:** `.review/PLAN.round1-claude.md` (= current `PLAN.md`)
**Design bundle:** `/tmp/design-peppy-moth/david-dashboard/` (prototype at `project/David Dashboard.html`)

## Stage

DEVELOP — post-adversarial round 1, pre-implementation. The repo is empty except for `PLAN.md`, `README.md`, `.git/`.

## Your job

Round 2 adversarial review. **Stress-test Claude's round-1 rewrite, don't validate it.** Specifically:

### Stress-test Claude's pushback (did round 1 overcorrect?)

Claude (round 1) disagreed with three user decisions and proposed alternatives:

- **D1:** Static + GitHub Actions cron over standalone Next.js 16
- **D2:** Pre-fetched JSON over live GitHub API
- **D3:** Ship Variation A only, drop the both-layouts toggle

For each: **is Claude right, or is this a case of an over-engineered simplification?** Consider:
- Does the user want to learn Next.js 16? (Not stated, but the choice of Next.js 16 hints at it.)
- Does GitHub Actions YAML + commit-flow actually add complexity that offsets what it removes?
- Is the "ship A only, evaluate B via URL param" flow actually worse than the toggle?
- Is the Vercel read-only FS caveat (flagged in D2) a dealbreaker that breaks Claude's own hybrid proposal?

### Stress-test what Claude missed

Find new failure modes, hidden costs, or wrong premises. Specifically scrutinize:

1. **No-flash theme script in Next 16 / React 19.** Does the proposed inline-`<script>`-before-hydration actually work without mismatch warnings? The prototype does it with a plain `<script>` before `<body>`. Next.js App Router's `<head>` behavior and React 19's hydration rules have edge cases.
2. **Ghost-card persistence via localStorage.** Is a single-device one-user persistence story a footgun? What happens if David clears browser storage? What if the user has the dashboard open on laptop + iPad?
3. **ISO-week key rollover.** Is "blank on Monday 00:00" actually the right behavior for an ADHD anchor, or is it a regression from "the last priority you wrote"? David never explicitly chose.
4. **Vercel read-only FS.** The D2 proposal writes `last-known-good.json` from the route handler. Claude flagged this as a blocker but didn't resolve it. Propose a concrete fix: Vercel KV, commit-via-GH-Action, Edge Config, or bundled-at-build-time fallback?
5. **The `thensmt` org assumption.** The PROJECTS seed shows `https://github.com/thensmt/…`. But `thensmt` could be a personal account that looks like an org, or a real GitHub Organization. The Octokit call differs (`listForUser` vs `listForOrg`). Which is it? Check via `gh api /users/thensmt` if you have gh access, or flag for the user to confirm.
6. **Tailwind CSS-var mapping.** Round 1 says "every CSS token → Tailwind color entry." But the prototype has tokens like `--ink-40`, `--surface-2`, `--focus-card-bg` — none map cleanly to Tailwind color naming conventions. Is `theme.extend.colors` the right home, or do some belong in `theme.extend.backgroundColor`? Is there a simpler approach (just use `bg-[var(--surface)]` everywhere and skip the Tailwind config mapping)?
7. **The design's "Week 16" literal.** Topbar shows `NSMT · Projects · Week 16 · Apr 19, 2026` in the prototype. Is that dynamic (from `isoWeek.ts`) or literal? Round 1 says dynamic. Check the prototype.
8. **Motion accessibility beyond `prefers-reduced-motion`.** The prototype has some animations that loop indefinitely (barber pole, marching dashes, active pulse). Reduce-motion stops them. But what about users who tolerate motion but not *infinite* motion? Not an a11y requirement, but worth naming.
9. **PresentMode toggle persistence.** Round 1 says it persists to localStorage. But: if you're in present mode and your laptop goes to sleep during a call, and the screen wakes up in present mode, is that what you want? Probably yes. But flag any session-vs-persistent decision Claude glossed.
10. **The "New Project" card.** Round 1 says ship it as UI-only with a toast ("not wired in demo" per prototype). Is that acceptable for a v1, or is it the kind of half-finished thing that'll annoy David? No firm ask, just a gut check.

### Output format

Write findings to `.review/CODEX_FINDINGS.md` with this structure:

```markdown
# Codex Round 2 Findings

## Agreements with Claude round 1 (what stands)
[list, brief]

## Disagreements with Claude round 1 (where to back off)
[each with: finding ID from round 1, reason to reject/amend, proposed replacement text]

## New findings Claude missed
[numbered, with file:line refs when applicable, severity P0–P5]

## Blockers that need user decision
[list items that can't be resolved in round 2]

## Proposed concrete edits to PLAN.md
[section-by-section: "In § X, replace ... with ..." — so round-2 Claude can apply mechanically]

## Verdict
[one-paragraph summary]
```

**Do not rewrite PLAN.md.** Claude will synthesize in round 2.

## Constraints

- Be concrete. File:line references for every claim.
- Be concise. If something is fine, say so in one line, don't restate it.
- Assume the reader has already read PLAN.md; don't summarize it back.
- If you don't have shell access to `gh api` for a runtime check, flag the unverified claims so they can be checked before implementation.

## Runtime context

- macOS (Apple Silicon), bun + npm available.
- No GitHub remote yet on `nsmt-dashboard` repo.
- Design bundle is local at `/tmp/design-peppy-moth/`.
