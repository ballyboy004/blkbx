# BLACKBOX — Decisions Log

**Last Updated:** 2026-01-25
**Local Path:** `/Users/samuelgilmore/Documents/blkbx`
**GitHub:** `ballyboy004/blackbox`

---

## Current State

V1 is live. Core features complete:
- Auth (Supabase email/password)
- Onboarding (5 panels + Claude follow-ups)
- Dashboard with AI-generated tasks
- Task complete/skip with reflections
- Behavioral learning (adapts to patterns)
- Task prefetching
- History dropdown

**Stack:** Next.js 14 + Supabase + Claude API + Tailwind

---

## Architecture Decisions

### AUTH-001: Supabase email/password
- No magic links, no social login
- Session stored in cookies via @supabase/ssr

### DATA-001: Three core tables
- `profiles` — artist context (id = auth.users.id)
- `tasks` — completed/skipped history
- `interpretations` — cached AI responses (7-day TTL)
- All have RLS enabled

### INTEL-001: Task generation flow
1. `routing.ts` picks task TYPE based on user state
2. `framework.ts` builds system prompt
3. `interpret.ts` calls Claude (claude-3-5-haiku)
4. Response cached in `interpretations`

### INTEL-002: Personalization requirements
- Every task title MUST include aesthetic/genre
- Reasoning must reference 2+ profile elements
- Tasks build on last completed (progression logic)
- 3+ skips → reflection prompt

### INTEL-003: Prompt versioning
- `PROMPT_VERSION` in `/lib/intelligence/interpret.ts`
- Increment when changing prompts → cache invalidates

### UX-001: Design system
- IBM Plex Mono throughout
- Dark backgrounds, frosted glass cards
- No emojis, no bright colors, no gamification

### UX-002: Voice
- Second-person ("you")
- Direct, observational
- Reference their exact words
- NO hype ("crush it", "you got this")

---

## File Locations

**Dashboard:** `/app/dashboard/page.tsx`
**Task card:** `/components/dashboard/TodayCard.tsx`
**Task actions:** `/app/dashboard/actions/tasks.ts`
**AI brain:** `/lib/intelligence/` (framework, routing, prompts, interpret, history)
**Profile types:** `/lib/profile/profile.ts`
**Supabase clients:** `/lib/supabase/` (client.ts, server.ts)

---

## Don't Touch Without Reason

- `/lib/intelligence/framework.ts` — heavily tuned prompts
- Card styling in TodayCard — took many iterations
- RLS policies in Supabase

---

## Recent Changes (2026-01-25)

- Renamed repo to `blackbox`, folder to `blkbx`
- New Vercel project (old webhook was broken)
- Added history dropdown to TodayCard
- History shows past tasks, click for details

---

## Pending / Known Issues

- None blocking

---

## How to Work on This Project

1. Read relevant files first
2. Make surgical edits (not full rewrites)
3. Match existing patterns
4. Test locally: `npm run dev`
5. Push: `git add -A && git commit -m "..." && git push`
