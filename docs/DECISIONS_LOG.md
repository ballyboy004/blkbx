# DECISIONS_LOG.md
**Last Updated:** 2026-01-25

---

## How to Use This Log

**Only log Level-2 (system) decisions** — changes that affect multiple modules, architecture, or future behavior.

Do NOT log:
- UI spacing tweaks
- Copy changes
- Bug fixes
- Local refactors

---

## Entry Format

```
## YYYY-MM-DD <Short Decision Title>
- <Concise factual statement of what was decided>
- <What changed or was locked>
- <Files affected, if relevant>
```

---

## Decisions

## 2026-01-25 Vercel Project Recreation
- Old Vercel project had broken GitHub webhook; deployments weren't triggering
- Deleted old project, created new one with fresh GitHub connection
- New project auto-deploys on push to main

## 2026-01-25 Repo Renamed
- GitHub repo renamed from `v0-blackbox-login-page` to `blackbox`
- Local folder: `/Users/samuelgilmore/Documents/blkbox`
- Remote URL: `https://github.com/ballyboy004/blkbx.git`

## 2026-01-23 Intelligence Framework V3
- Complete rewrite of `lib/intelligence/framework.ts`
- Mandatory aesthetic enforcement: every task must include genre/aesthetic in title AND reasoning
- Behavioral thresholds: 1 skip = note, 2 = adapt, 3+ = hard correct
- Constraint reframing: turn limitations into advantages
- Quality self-check before output

## 2026-01-23 Task History Feature
- Added history dropdown to TodayCard
- Fetches reasoning + guardrail from tasks table
- Click task opens detail modal
- Files: `components/dashboard/TodayCard.tsx`, `lib/intelligence/history.ts`

## 2026-01-20 Task Prefetching
- Background pre-generation of next task while user views current
- Stored in `interpretations.prefetched_task` column
- Enables instant task delivery after first load
- Files: `lib/intelligence/prefetch.ts`, `app/api/intelligence/prefetch/route.ts`

## 2026-01-15 Moved from Netlify to Vercel
- Netlify had 10s function timeout; Claude calls exceeded it
- Vercel has 60s timeout on hobby plan
- All deployment config updated

## 2026-01-10 7-Day Intelligence Cache
- Interpretations cached for 7 days to reduce API costs
- Cache key includes `prompt_version` for invalidation on prompt changes
- Files: `lib/intelligence/cache.ts`, `lib/intelligence/interpret.ts`

## 2026-01-05 Onboarding Expanded to 5 Panels
- Added Panel 4: Current State (content_activity, release_status, stuck_on)
- Added Panel 5: Claude follow-up questions
- New profile fields added to Supabase
- Files: `app/onboarding/*`, `lib/profile/profile.ts`

## 2025-12-31 Task Routing System
- Code determines task TYPE, AI fills specifics
- Routes based on: content_activity, release_status, skip patterns
- Files: `lib/intelligence/routing.ts`

## 2025-12-30 Supabase as Primary Database
- Replaced Airtable with Supabase (Postgres + Auth + RLS)
- All tables have row-level security
- User ID = auth.users.id across all tables

## 2025-12-30 Next.js App Router
- Committed to Next.js (App Router) over Softr/Notion
- Enables real app workflows: auth, onboarding, dashboard
- Dark minimal aesthetic locked as brand identity

## 2025-12-30 Design System Locked
- IBM Plex Mono typography throughout
- Frosted glass cards with specific rgba values
- No emojis, no bright colors, no gamification
- Voice: second-person, grounded, observational
