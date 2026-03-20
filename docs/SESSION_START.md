# BLACKBOX — Session Start
**Read this at the start of every new Claude session.**
**Then read LAUNCH_CHECKLIST.md to know what to work on.**

---

## What BLACKBOX is

Career intelligence system for independent artists and producers.
Not a marketing tool. Not a content scheduler. Infrastructure.

Core: adaptive onboarding → campaign workspace → execution system → intelligence layer.

**Stack:** Next.js 14 App Router, Supabase (Postgres + Auth + RLS), Claude API, Tailwind, Railway
**Repo:** `/Users/samuelgilmore/Documents/blkbox` — GitHub: `ballyboy004/blkbx`
**Dev:** `npm run dev` from repo root
**Local URL:** `http://localhost:3000` (sometimes 3001 if port conflict)

---

## Engineering workflow

**Claude (this chat):** Architecture, decisions, Cursor prompts
**Cursor:** Code execution only — receives copy-pasted prompts
**Never:** Claude writes directly to files (causes drift)

Always output: Implementation Instructions + CURSOR PROMPT block.

---

## Key files to read before working

```
/docs/LAUNCH_CHECKLIST.md          ← current state + what to build next
/docs/LIVE_SCHEMA_SOURCE_OF_TRUTH.md ← DB schema authority (always check before inventing fields)
/docs/DECISIONS_LOG.md             ← why things were built the way they were
BLACKBOX_MASTER_CONTEXT.md         ← product philosophy (root level)
```

---

## Architecture in one page

```
auth.users
  ↓
profiles              ← artist identity, onboarding data, subscription status
  ↓
campaigns             ← one campaign per release
  ↓
campaign_tasks        ← milestones (parent_id=null) + sub-tasks (parent_id=uuid)
content_pieces        ← AI-generated assets (strategy, captions, email, press_release, curator_pitch)
```

**Core principle:** DB + module logic = source of truth. AI assists generation only. Never the reverse.

**Module boundary:** `lib/modules/campaign/` — all campaign logic lives here.
- `intelligence.ts` — pure functions, derives UI state from DB state
- `state.ts` — `resolveCampaignState()` — determines NEXT MOVE
- `actions.ts` — server actions (generate tasks, assets, strategy)
- `generate/` — Claude API generators (one file per asset type)
- `queries.ts` / `mutations.ts` — DB operations only

---

## Current UI routes

```
/onboarding              ← adaptive 6-7 panel flow, ends with AI interpretation
/campaign/[id]           ← primary workspace (Mission / Work / AI)
/campaign/[id]/review/[assetId] ← asset approval workflow
/campaign/new            ← campaign creation form
/dashboard               ← redirects to active campaign
/upgrade                 ← Stripe paywall page (not built yet)
```

---

## Design system

- Background: `#0c0c0e` (both onboarding and workspace)
- Mission card: `#131315`
- Secondary cards: `#111113`
- All card borders: `rgba(255,255,255,0.08)`
- Border radius: `4px` on cards, `6px` on pills
- Directive text (NEXT MOVE): `font-inter font-black` — Inter Black
- Labels / metadata: `font-mono` IBM Plex Mono
- Typography tokens: `lib/design-system.ts`

---

## Rules

1. Check `LIVE_SCHEMA_SOURCE_OF_TRUTH.md` before any DB field reference
2. Never invent schema fields — state "DATABASE CHANGES REQUIRED" if needed
3. Surgical changes only — affect 1-2 files, never broad rewrites
4. Log major decisions in `DECISIONS_LOG.md`
5. Update `LAUNCH_CHECKLIST.md` at end of each session

---

## How to start any session

1. Read this file
2. Read `LAUNCH_CHECKLIST.md`
3. Ask Samuel: "What are we working on today?"
4. Check relevant files before writing any prompts
