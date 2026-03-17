# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What BLACKBOX is

Career intelligence system for independent artists and producers. Not a marketing tool. Not a content scheduler. Infrastructure.

Core: adaptive onboarding → campaign workspace → execution system → intelligence layer.

**Stack:** Next.js 14 App Router, Supabase (Postgres + Auth + RLS), Claude API, Tailwind, Railway

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000, sometimes 3001 if port conflict)
npm run build    # Production build
npm run lint     # ESLint
```

No test suite is configured.

## Architecture

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

**Data flow:** Server component fetches DB state → passes props to client component → mutations go through server actions → AI output is always persisted to DB before rendering. Never render AI output that hasn't been persisted first.

## UI Routes

```
/onboarding                      ← adaptive 6-7 panel flow, ends with AI interpretation
/campaign/[id]                   ← primary workspace (Mission / Work / AI)
/campaign/[id]/review/[assetId]  ← asset approval workflow
/campaign/new                    ← campaign creation form
/dashboard                       ← redirects to active campaign
/upgrade                         ← Stripe paywall page (not built yet)
```

The campaign workspace has a fixed three-layer structure: Mission / Work / AI — do not restructure this.

## Design System

All tokens live in `lib/design-system.ts` — never invent new styles.

- Background: `#0c0c0e`
- Mission card: `#131315`, secondary cards: `#111113`
- Card borders: `rgba(255,255,255,0.08)`
- Border radius: `4px` on cards, `6px` on pills
- Directive text: `font-inter font-black` (Inter Black)
- Labels/metadata: `font-mono` (IBM Plex Mono)

Do not add backdrop-filter/blur, gradients, or change border-radius values. Do not modify the onboarding sliding animation (900ms, cubic-bezier).

## Rules

1. Check `docs/LIVE_SCHEMA_SOURCE_OF_TRUTH.md` before any DB field reference — never invent schema fields. State "DATABASE CHANGES REQUIRED" if schema changes are needed.
2. Surgical changes only — affect 1–2 files, never broad rewrites.
3. Log major decisions in `DECISIONS_LOG.md`.
4. Update `docs/LAUNCH_CHECKLIST.md` at end of each session.
5. Check `subscription_status` on profile before unlocking paid features.
6. Generated tasks must be real-world artist actions — not app-internal instructions.

## Key Docs

```
docs/LAUNCH_CHECKLIST.md           ← current state + what to build next
docs/LIVE_SCHEMA_SOURCE_OF_TRUTH.md ← DB schema authority
DECISIONS_LOG.md                   ← why things were built the way they were
docs/CURSOR_RULES.md               ← engineering rules and patterns
```
