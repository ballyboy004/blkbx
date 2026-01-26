# PROJECT_STATE.md
**Last Updated:** 2026-01-26

---

## Stack

| Layer | Tech | Version |
|-------|------|---------|
| Framework | Next.js (App Router) | 16.0.10 |
| Runtime | React | 19.2.0 |
| Database | Supabase (Postgres + Auth) | @supabase/ssr 0.8.0 |
| AI | Claude API | @anthropic-ai/sdk 0.71.2 |
| Styling | Tailwind CSS | 4.1.9 |
| Deployment | Vercel | Auto-deploy on push |

**Local Path:** `/Users/samuelgilmore/Documents/blkbox`
**GitHub:** `ballyboy004/blackbox`

---

## Environment Variables (names only)

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Implemented Features

### Auth
- [x] Email/password signup (`/signup`)
- [x] Email/password login (`/` root page)
- [x] Auth callback handler (`/auth/callback`)
- [x] Sign out (`/auth/signout`)
- [x] Middleware-based route protection

### Onboarding
- [x] 5-panel flow (`/onboarding`)
- [x] Panel 1: Context (who they are)
- [x] Panel 2: Direction (goal, genre, career stage)
- [x] Panel 3: Patterns (strengths, weaknesses, constraints)
- [x] Panel 4: Current state (content activity, release status, stuck on)
- [x] Panel 5: Claude-powered follow-up questions
- [x] Profile persistence to Supabase

### Dashboard
- [x] Server-rendered page (`/dashboard`)
- [x] Current Read (AI interpretation)
- [x] Profile card with edit modal
- [x] Patterns card (edge + friction)
- [x] Today task card (hero position)
- [x] Task history dropdown
- [x] Collapsible sections (context notes, next actions)
- [x] Refresh intelligence button

### Intelligence System
- [x] Task routing by user state (`lib/intelligence/routing.ts`)
- [x] System prompt builder (`lib/intelligence/framework.ts`)
- [x] Claude API integration (`lib/intelligence/claude.ts`)
- [x] Response validation (`lib/intelligence/validate.ts`)
- [x] 7-day caching (`lib/intelligence/cache.ts`)
- [x] Task prefetching (`lib/intelligence/prefetch.ts`)
- [x] Behavioral history tracking (`lib/intelligence/history.ts`)

### Task System
- [x] Complete task with optional reflection
- [x] Skip task
- [x] Task history storage
- [x] Progression logic (tasks build on each other)

---

## Routes & Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Login page |
| `/signup` | `app/signup/page.tsx` | Signup page |
| `/onboarding` | `app/onboarding/page.tsx` | Onboarding flow |
| `/dashboard` | `app/dashboard/page.tsx` | Main dashboard |
| `/auth/callback` | `app/auth/callback/route.ts` | Auth callback |
| `/auth/signout` | `app/auth/signout/route.ts` | Sign out |

---

## API Routes

| Route | File | Purpose |
|-------|------|---------|
| `/api/intelligence/refresh` | `app/api/intelligence/refresh/route.ts` | Generate new task |
| `/api/intelligence/prefetch` | `app/api/intelligence/prefetch/route.ts` | Pre-generate next task |
| `/api/intelligence/current-read` | `app/api/intelligence/current-read/route.ts` | Get current read only |
| `/api/intelligence/strategic-task` | `app/api/intelligence/strategic-task/route.ts` | Generate strategic task from user input |
| `/api/onboarding/followups` | `app/api/onboarding/followups/route.ts` | Generate follow-up questions |

---

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| TodayCard | `components/dashboard/TodayCard.tsx` | Hero task display, complete/skip, history dropdown |
| TaskGuideModal | `components/dashboard/TaskGuideModal.tsx` | Task instruction modal |
| EditProfileModal | `components/dashboard/EditProfileModal.tsx` | Edit profile fields |
| CollapsibleSection | `components/dashboard/CollapsibleSection.tsx` | Expandable sections |
| FreshButton | `components/dashboard/FreshButton.tsx` | Refresh intelligence |

---

## Supabase Schema

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, = auth.users.id |
| email | text | NOT NULL |
| context | text | Panel 1 |
| primary_goal | text | Panel 2 |
| genre_sound | text | Panel 2 |
| career_stage | text | Panel 2 |
| strengths | text | Panel 3 |
| weaknesses | text | Panel 3 |
| constraints | text | Panel 3 |
| current_focus | text | Panel 3 |
| content_activity | text | Panel 4 |
| release_status | text | Panel 4 |
| stuck_on | text | Panel 4 |
| onboarding_completed | boolean | |
| onboarding_completed_at | timestamp | |

### tasks
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to auth.users |
| title | text | Task title |
| task_name | text | Legacy, same as title |
| reasoning | text | Why this task |
| guardrail | text | Constraint |
| status | text | 'pending', 'done', 'skipped' |
| reflection | text | User note on completion |
| completed_at | timestamp | |

### interpretations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK |
| interpretation | jsonb | Cached AI response |
| prompt_version | text | For cache invalidation |
| prefetched_task | jsonb | Pre-generated next task |
| created_at | timestamp | TTL = 7 days |

**RLS:** All tables have row-level security enabled. Users can only access their own rows.

---

## Known Bugs / Risks

1. **Legacy fields** — `task_name` duplicates `title` in tasks table
2. **Unused component** — `StrategicInputForm` component exists but is not currently used in the dashboard

---

## File Locations (Quick Reference)

```
/app/dashboard/page.tsx          — Dashboard server component
/app/dashboard/actions/tasks.ts  — completeTask, skipTask server actions
/components/dashboard/TodayCard.tsx — Most complex UI component
/lib/intelligence/framework.ts   — System prompt (DO NOT TOUCH without review)
/lib/intelligence/routing.ts     — Task type routing
/lib/intelligence/interpret.ts   — Claude API calls
/lib/intelligence/history.ts     — Behavioral history
/lib/profile/profile.ts          — Profile type + auth helpers
/lib/supabase/server.ts          — Server Supabase client
/lib/supabase/client.ts          — Browser Supabase client
```
