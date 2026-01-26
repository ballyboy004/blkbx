# BLACKBOX Engineering Handoff — V1

**Last Updated:** 2026-01-25
**Local Path:** `/Users/samuelgilmore/Documents/blkbx`
**GitHub:** `ballyboy004/blackbox`
**Deployment:** Vercel (auto-deploys on push to main)

---

## ⚠️ CRITICAL OPERATING RULES

**Before writing ANY code:**
1. **READ the existing file first.** Use `view` tool. Understand what's there.
2. **Match existing patterns.** Look at how similar things are done.
3. **Make SURGICAL edits.** Never rewrite entire files.
4. **Ask before architectural changes.** Don't assume.

**When writing code:**
5. **Show only changed parts.** Not entire files.
6. **Preserve the aesthetic.** Dark, minimal, calm. No SaaS templates.
7. **No over-engineering.** Simplest solution that works.
8. **Handle errors gracefully.** API calls fail. Plan for it.

**After writing code:**
9. **Test locally first** if possible: `npm run dev`
10. **Provide complete git commands:** `git add -A && git commit -m "..." && git push`

---

## Project Overview

**BLACKBOX** is a career intelligence system for independent artists.

**What it does:**
- Captures artist context through onboarding (identity, goals, constraints, patterns)
- Generates personalized AI tasks based on their specific situation
- Learns from completed/skipped tasks to adapt recommendations
- Calm, minimal dashboard — no gamification, no hype

**Core philosophy:**
- Infrastructure over tactics
- Depth over reach  
- Clarity over noise
- Tasks are "signals, not commands"

**Decision rule:** "Does this increase clarity, or increase noise?" If noise → don't ship.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | Claude API (claude-3-5-haiku) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Deployment | Vercel |

---

## Directory Structure

```
/app
  /dashboard              — Main dashboard (server component)
    /actions/tasks.ts     — Server actions: completeTask, skipTask
    page.tsx              — Dashboard page
  /api/intelligence
    /refresh/route.ts     — Generate new task endpoint
    /prefetch/route.ts    — Background pre-generation
  /onboarding             — 5-panel onboarding flow
  /auth/callback          — Auth callback handler
  page.tsx                — Login page
  /signup/page.tsx        — Signup page

/components/dashboard
  TodayCard.tsx           — Hero task card (COMPLEX - be careful)
  TaskGuideModal.tsx      — Task instruction modal
  EditProfileModal.tsx    — Profile editing
  CollapsibleSection.tsx  — Expandable sections
  FreshButton.tsx         — Refresh intelligence button

/lib
  /intelligence           — AI brain (CRITICAL - don't touch casually)
    framework.ts          — System prompt builder
    routing.ts            — Task type routing logic
    prompts.ts            — Prompt assembly
    history.ts            — Behavioral history fetching
    interpret.ts          — Claude API calls + validation
    validate.ts           — Response JSON validation
    cache.ts              — 7-day interpretation caching
    prefetch.ts           — Task pre-loading system
  /profile
    profile.ts            — Profile types + auth helpers
  /supabase
    client.ts             — Browser Supabase client
    server.ts             — Server Supabase client
  /dashboard
    intelligence.ts       — Dashboard data fetching
```

---

## Database Schema (Supabase)

**profiles** — Artist identity and context
```sql
id (uuid, PK, = auth.users.id)
email (text, NOT NULL)
context (text)              -- Who they are
primary_goal (text)         -- What they want
genre_sound (text)          -- Their aesthetic
career_stage (text)         -- early/building/momentum/breakout/pro
strengths (text)
weaknesses (text)
constraints (text)          -- Time/money/energy limits
current_focus (text)        -- Next 30 days
content_activity (text)     -- never/rarely/sometimes/regular
release_status (text)       -- unreleased/first/few/catalog
stuck_on (text)             -- Current blocker
created_at, updated_at
```

**tasks** — Completed/skipped task history
```sql
id (uuid, PK)
user_id (uuid, FK)
title (text)
reasoning (text)
guardrail (text)
status (text)               -- 'done' or 'skipped'
reflection (text)           -- User's note on completion
completed_at (timestamp)
```

**interpretations** — Cached AI responses
```sql
id (uuid, PK)
user_id (uuid, FK)
interpretation (jsonb)      -- Full dashboard intelligence
prompt_version (text)       -- Cache invalidation key
prefetched_task (jsonb)     -- Pre-generated next task
created_at (timestamp)
```

**All tables have RLS enabled.** Users can only access their own data.

---

## Design System

**Typography (IBM Plex Mono throughout):**
```javascript
// Labels
"font-mono text-[12px] font-bold tracking-[0.2em] uppercase text-zinc-500"

// Body text
"font-mono text-[14px] font-normal tracking-normal leading-[1.7] text-zinc-300"

// Headers
"font-mono text-[13px] font-bold tracking-[0.2em] uppercase text-zinc-500"

// Buttons
"font-mono text-[9px] tracking-[0.12em] uppercase"
```

**Card Style:**
```javascript
{
  background: 'rgba(26, 26, 26, 0.4)',
  backdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '4px',
  boxShadow: '0 9px 24px rgba(0, 0, 0, 0.5)'
}
```

**Voice:**
- Second-person ("you")
- Direct, grounded, observational
- Reference their specific context BY NAME
- NO hype, NO "crush it", NO "you got this"
- NO emojis, NO bright colors

---

## Intelligence System (How It Works)

**Task generation flow:**

1. `routing.ts` → Determines task TYPE based on:
   - content_activity (never/rarely/sometimes/regular)
   - release_status (unreleased/first/few/catalog)
   - Skip patterns (3+ skips → reflection prompt)
   - Last completed task (progression logic)

2. `framework.ts` → Builds system prompt with:
   - Voice rules + examples
   - Personalization requirements
   - Quality self-checks
   - Constraint reframing logic

3. `prompts.ts` → Assembles final prompt:
   - Routing instructions
   - Behavioral history
   - Profile data

4. `interpret.ts` → Calls Claude API:
   - Validates JSON response
   - Caches result (7 days)
   - Returns structured data

**Key intelligence rules:**
- Every task MUST include aesthetic/genre in title AND reasoning
- Reference at least 2 profile elements
- Build on last completed task (don't restart workflows)
- After 3+ skips → trigger reflection, try different approach
- Reframe constraints as strategic advantages

**Prompt versioning:**
- `PROMPT_VERSION` in interpret.ts
- Increment when changing prompts → invalidates cache

---

## Current Features (V1)

✅ Auth (email/password via Supabase)
✅ Onboarding (5 panels + Claude follow-up questions)
✅ Dashboard (Current Read, Profile, Patterns, Today task)
✅ Task system (complete/skip with reflection)
✅ Behavioral learning (adapts based on history)
✅ Task prefetching (instant delivery)
✅ History dropdown (view past tasks)
✅ Edit profile modal
✅ Guide modal (task instructions)

---

## Common Pitfalls (AVOID)

| Don't | Why |
|-------|-----|
| Rewrite framework.ts casually | It's heavily tuned. Changes break task quality. |
| Remove error handling | API calls fail. Handle gracefully. |
| Add dependencies without asking | Keep it lean. |
| Change card styling | It's intentional. Took iterations. |
| Make tasks generic | Always tie to user's aesthetic/constraints. |
| Add loading spinners everywhere | Keep it calm. |
| Add emojis or bright colors | Dark and minimal. |
| Use `console.log` in production | Use conditional logging. |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://eitwejggilzljkslnqhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdHdlamdnaWx6bGprc2xucWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk4NDYsImV4cCI6MjA4MjcwNTg0Nn0.xjL9tvlxxF-UfTnSJ2wuULOyIg4ceSK4ElRop3ets5Y
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## Git Workflow

```bash
cd ~/Documents/blkbx
git add -A
git commit -m "Description of change"
git push
```

Vercel auto-deploys on push to main.

---

## Quick Reference

**Run locally:**
```bash
cd ~/Documents/blkbx
npm run dev
# Open http://localhost:3000
```

**Add Supabase migration:**
```bash
# Run SQL in Supabase Dashboard → SQL Editor
```

**Check deployment:**
- Vercel dashboard → Deployments tab
- Should trigger within 10 seconds of push

---

## When Asked to Build Something

1. First ask: "What files should I read to understand this?"
2. Read them with `view` tool
3. Identify the pattern used elsewhere
4. Make minimal changes
5. Test impact on existing functionality
6. Provide complete solution + git commands

**Never assume. Always verify.**
