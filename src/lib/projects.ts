import type { RepoMeta } from "@/types";

/**
 * Seed project metadata keyed by repo slug. Anything in here gets treated as a
 * tracked project; repos present on GitHub but missing from this map render as
 * ghost cards. See PLAN.md D6 for the overrides flow.
 */
export const PROJECT_META: Record<string, RepoMeta> = {
  "nsmt-livestream": {
    type: "Broadcast",
    status: "Active",
    desc: "Live broadcast overlay and producer UI for NSMT basketball and football streams.",
    next: "Wire halftime card overlay to producer controls.",
    stack: ["Python", "WebSockets", "Capacitor", "iOS", "Android", "OBS"],
    live: "http://localhost:8000/nsmt-producer.html",
    path: "~/Downloads/Claude/NSMT/nsmt-livestream",
  },
  "nsmt-fastbreak": {
    type: "Tooling",
    status: "In Progress",
    desc: "iPad-first stat tracking PWA. Exports LegitGM-style PDF box scores.",
    next: "Build event-logging UI for 12 operator buttons.",
    stack: ["Node", "Express 5", "WS", "OBS-websocket"],
    live: null,
    path: "~/Downloads/Claude/NSMT/nsmt-fastbreak",
  },
  bitburg: {
    type: "Marketplace",
    status: "In Progress",
    desc: "Two-sided marketplace for DMV photographers, videographers, editors. Tiered vetting.",
    next: "Finish creator onboarding flow.",
    stack: [
      "Next.js 16",
      "React 19",
      "Prisma",
      "Clerk",
      "Stripe",
      "Supabase",
      "Tailwind",
    ],
    live: "http://localhost:3000",
    path: "~/Downloads/Claude/NSMT/bitburg",
  },
  "little-rock": {
    type: "Tooling",
    status: "Paused",
    desc: "Internal utility, parked while Hoopfest and livestream work take priority.",
    next: "Revisit scope in Q3.",
    stack: ["React", "Vite", "Firebase", "AWS Lambda", "DynamoDB", "Stripe"],
    live: null,
    path: "~/Downloads/Claude/NSMT/little-rock",
  },
  "nsmt-content-pipeline": {
    type: "Tooling",
    status: "Active",
    desc: "Automates social content packaging: YouTube, Instagram, X threads from game footage.",
    next: "Add X thread generator.",
    stack: ["Python", "Claude API", "Contentful", "GitHub Actions"],
    live: null,
    path: "~/Downloads/Claude/NSMT/nsmt-content-pipeline",
  },
  scorebug: {
    type: "Broadcast",
    status: "Shipped",
    desc: "Live scorebug overlay in production for every NSMT broadcast. Firebase-connected.",
    next: "Ship v3 with new brand system.",
    stack: ["Firebase", "Node 20", "HTML/JS", "WebSockets"],
    live: "https://scorebug.thensmt.com",
    path: "~/Downloads/Claude/NSMT/scorebug",
    displayName: "Project Austin",
    subname: "scorebug",
  },
};

/**
 * Status ordering for focus-band selection and sort stability.
 * Active > In Progress > Paused > Shipped.
 */
export const STATUS_ORDER: Record<string, number> = {
  Active: 0,
  "In Progress": 1,
  Paused: 2,
  Shipped: 3,
};
