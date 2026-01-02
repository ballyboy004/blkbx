# BLACKBOX — Decision Log (Master)
**File:** `BLACKBOX_DECISION_LOG.md`  
**Timezone:** America/Los_Angeles  
**Owner:** Samuel  
**Scope:** Major decisions + implementations completed so far (V1 build)

---

## 2025-12-30-ARCH-001 — Commit to Next.js as the V1 app foundation
**Area:** Engineering / Architecture  
**Decision:** BLACKBOX V1 will be built as a Next.js app (App Router), not Softr/Notion/Softr-style frontends.  
**Rationale:** Softr is too limiting for the complexity and future feature depth. Next.js gives control over routing, UI, auth flows, and future modularity.  
**Alternatives Considered:**
- Softr: rejected (limits, not future-proof)
- Notion-only: rejected (too “guide-like,” not a product engine)
**Tradeoffs & Risks:** Higher learning curve, more upfront engineering complexity.  
**Impact on V1:** Enables real app workflows (auth, onboarding, dashboard, data-driven UI).  
**Notes:** You explicitly want minimalist, dark, modern design with “real product” feel.

---

## 2025-12-30-ARCH-002 — Commit to Supabase as primary database + auth
**Area:** Engineering / Architecture  
**Decision:** Supabase is the backend for V1 (Postgres + Auth + RLS).  
**Rationale:** Replaces Airtable as the product backbone; supports RLS, structured schema, scalable queries, and real auth.  
**Alternatives Considered:**
- Airtable-only DB: rejected (limitations for auth/RLS and complexity)
- Firebase: not chosen (Postgres + RLS fits better with structured relational model)
**Tradeoffs & Risks:** Requires correct RLS and schema design; auth configuration can block progress if misconfigured.  
**Impact on V1:** Enables secure, multi-tenant product behavior.

---

## 2025-12-30-ARCH-003 — Keep n8n as automation layer (already in motion)
**Area:** Infrastructure  
**Decision:** n8n remains the automation engine, with first workflow being “release task generation.”  
**Rationale:** It’s already built and aligns with the “infrastructure” philosophy—turn intention into executable systems.  
**Alternatives Considered:**
- No automation: rejected (V1 needs an engine, not a static guide)
- Custom cron/queues immediately: deferred (premature complexity)
**Tradeoffs & Risks:** n8n introduces external dependency and operational overhead.  
**Impact on V1:** Provides early “machine” behavior.

---

## 2025-12-30-PROD-001 — V1 must be a lightweight product engine, not a guide
**Area:** Product / Scope  
**Decision:** V1 cannot be a “strategy document app.” It must do real work for the user (store signal, generate outputs, guide next actions).  
**Rationale:** Users won’t return if V1 is just advice. BLACKBOX must reduce friction immediately.  
**Alternatives Considered:**
- V1 as static guidance: rejected (low retention, weak differentiation)
**Tradeoffs & Risks:** Requires careful scope control to avoid building “everything.”  
**Impact on V1:** Forces a minimum viable engine + persistent user state.

---

## 2025-12-30-PROD-002 — BLACKBOX must serve artists across all stages (100 → 100,000 listeners)
**Area:** Product / Scope  
**Decision:** V1 onboarding + logic must support wide range of artists (not only “mid-tier”).  
**Rationale:** Market expansion + adaptability is core; intelligence layer must personalize without requiring a narrow niche.  
**Alternatives Considered:**
- Target only 5k–500k listeners: softened for V1 so onboarding supports any stage
**Tradeoffs & Risks:** Broad target increases variance; requires stronger personalization logic.  
**Impact on V1:** Onboarding captures constraints and stage to adapt outputs.

---

## 2025-12-30-UX-001 — Dark minimalist aesthetic locked as brand identity, even in V1
**Area:** UX / Brand  
**Decision:** V1 will still look “secret / exclusive / dark / minimal,” not like a generic SaaS template.  
**Rationale:** Brand trust and differentiation are part of product value.  
**Alternatives Considered:**
- Generic UI template: rejected (dilutes soul)
**Tradeoffs & Risks:** Styling iterations can become a time sink (already happened).  
**Impact on V1:** Requires design discipline and reusable styling tokens.

---

## 2025-12-30-UX-002 — “Modern Neue-ish” typography direction; avoid Garamond/Cormorant vibes
**Area:** UX / Brand  
**Decision:** Typography direction is modern, clean, “Neue-ish” (user explicitly hates Cormorant Garamond).  
**Rationale:** Aligns with minimal, modern, high-end aesthetic.  
**Alternatives Considered:**
- Cormorant Garamond: rejected explicitly by user  
**Tradeoffs & Risks:** Font loading/config must be consistent across pages.  
**Impact on V1:** Visual identity standardization.

---

## 2025-12-30-UX-003 — Introduce “3D void vignette” background as signature style motif
**Area:** UX / Brand  
**Decision:** Landing/login/onboarding pages use a layered radial gradient “void” vignette background (black/grey) to create depth.  
**Rationale:** Matches reference aesthetic, adds “3D” presence without images.  
**Alternatives Considered:**
- Flat black background: too plain / not distinctive  
**Tradeoffs & Risks:** Must ensure no clipping, spacing issues, consistent rendering.  
**Impact on V1:** A recognizable visual motif for brand cohesion.

---

## 2025-12-30-ENG-001 — Use one login entry page (remove duplicate /login)
**Area:** Engineering / Architecture  
**Decision:** Avoid having both `app/page.tsx` and `app/login/page.tsx` competing; consolidate to a single source of truth.  
**Rationale:** Duplicate routes caused confusion and inconsistent UI behavior.  
**Alternatives Considered:**
- Keep both: rejected (caused conflicts and inconsistent look)
**Tradeoffs & Risks:** Requires clarity in routing and redirect logic.  
**Impact on V1:** Fewer routing mistakes, easier future auth guard.

---

## 2025-12-30-AUTH-001 — Move from magic-link-only to email+password support (preferred UX)
**Area:** Engineering / Auth  
**Decision:** Email/password auth is supported; magic link was tested and later deprioritized because user prefers password UX.  
**Rationale:** Better user expectation match; faster day-to-day usage; avoids email friction.  
**Alternatives Considered:**
- Magic link only: rejected (preference + friction)
**Tradeoffs & Risks:** Requires secure password rules and confirmation settings.  
**Impact on V1:** Auth becomes more standard and less annoying.

---

## 2025-12-30-AUTH-002 — Fix “Database error saving new user” by aligning auth+profiles logic
**Area:** Engineering / Auth  
**Decision:** Ensure signup/login flows correctly create users; resolve error by aligning Supabase auth settings and DB expectations.  
**Rationale:** Auth success must produce a stable user record path.  
**Alternatives Considered:** None practical—had to fix.  
**Tradeoffs & Risks:** Auth config changes can break flows again if not documented.  
**Impact on V1:** Unblocks onboarding and all user-specific data.

---

## 2025-12-30-DB-001 — Enable Row Level Security on core tables
**Area:** Database / Security  
**Decision:** RLS enabled for user-scoped tables (profiles, tasks, reflections, brand_profiles, releases, etc.).  
**Rationale:** Multi-tenant safety is non-negotiable.  
**Alternatives Considered:**
- No RLS: rejected (security risk)
**Tradeoffs & Risks:** Misconfigured policies can block app flows (needs careful testing).  
**Impact on V1:** Secure user data isolation.

---

## 2025-12-30-DB-002 — Standardize on `user_id` columns for simplest RLS (tasks + reflections)
**Area:** Database / Security  
**Decision:** Add `user_id` to `tasks` and `reflections`, and enforce policies using `auth.uid()`.  
**Rationale:** “Dead-simple and faster” RLS; consistent ownership model.  
**Alternatives Considered:**
- Ownership via joins/indirect relationships: rejected (complex and fragile)
**Tradeoffs & Risks:** Requires migrations and consistent insert logic.  
**Impact on V1:** RLS becomes straightforward; fewer edge cases.

---

## 2025-12-30-DB-003 — Profiles `email NOT NULL` means onboarding must guard for `user.email`
**Area:** Database / Engineering  
**Decision:** Onboarding code must validate that `user.email` exists before upsert because profiles requires it.  
**Rationale:** Avoid hard DB errors and protect data consistency.  
**Alternatives Considered:** Relax DB constraint: not chosen (data integrity preferred).  
**Tradeoffs & Risks:** Must keep consistent with auth provider behavior.  
**Impact on V1:** Cleaner onboarding writes; fewer confusing runtime errors.

---

## 2025-12-30-ENG-002 — Use `.env.local` for Supabase keys; only ANON/public key in client
**Area:** Engineering / Security  
**Decision:** Client uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Secret key is never used in browser.  
**Rationale:** Security best practice; secrets must stay server-side.  
**Alternatives Considered:** Using secret in client: rejected (security breach risk).  
**Tradeoffs & Risks:** Must ensure env loads properly; restart dev server after changes.  
**Impact on V1:** Secure config pattern.

---

## 2025-12-30-ENG-003 — Avoid pasting TS code into terminal; code changes happen in files
**Area:** Engineering / Process  
**Decision:** When you hit shell parse errors (zsh), the fix is: don’t paste TypeScript into terminal—edit in VS Code files.  
**Rationale:** Prevents wasted debugging on wrong execution environment.  
**Alternatives Considered:** None.  
**Tradeoffs & Risks:** None.  
**Impact on V1:** Faster iteration and fewer “WTF” errors.

---

## 2025-12-30-ENG-004 — Resolve repo workflow: use GitHub as source of truth + pull updates cleanly
**Area:** Engineering / Workflow  
**Decision:** Use the GitHub repo (v0-generated) as the main project base; bring local changes into it rather than maintaining divergent folders.  
**Rationale:** Prevents mismatched layouts and “it works in v0 but not localhost” drift.  
**Alternatives Considered:**
- Keep old blackbox folder and keep patching: rejected (causes confusion)
**Tradeoffs & Risks:** Merge conflicts possible (happened: `app/page.tsx` conflict).  
**Impact on V1:** Consistent, repeatable baseline.

---

## 2025-12-30-ENG-005 — Handle “unrelated histories” / merge conflicts by consolidating into one repo tree
**Area:** Engineering / Workflow  
**Decision:** When Git refuses merge due to unrelated histories/unmerged paths, resolve by finishing merge (or abort) then commit cleanly from correct directory.  
**Rationale:** Git requires one coherent history; conflicts must be resolved rather than ignored.  
**Alternatives Considered:** Re-clone fresh each time: not preferred long-term.  
**Tradeoffs & Risks:** Requires careful folder discipline in terminal.  
**Impact on V1:** Stabilizes development workflow.

---

## 2025-12-30-UX-004 — Lock the login page visuals; functional wiring must not change layout
**Area:** UX / Engineering  
**Decision:** Login page visuals are treated as “locked,” and auth wiring must be implemented without altering spacing/typography/structure.  
**Rationale:** You were losing hours due to accidental styling changes when adding logic.  
**Alternatives Considered:** Rebuild visuals every time: rejected.  
**Tradeoffs & Risks:** Requires careful code edits (change logic only).  
**Impact on V1:** Faster progress; fewer regressions.

---

## 2025-12-30-UX-005 — Use shadcn/ui components (Input/Button) for consistent feel
**Area:** UX / Engineering  
**Decision:** Use `@/components/ui/input` and `@/components/ui/button` for consistent styling + behavior.  
**Rationale:** Keeps controls consistent with v0 design system.  
**Alternatives Considered:** Plain HTML inputs everywhere: not chosen (inconsistency).  
**Tradeoffs & Risks:** Must ensure className overrides remain stable.  
**Impact on V1:** UI cohesion.

---

## 2025-12-30-ONBOARD-001 — Onboarding exists and is gated behind auth
**Area:** UX / Product  
**Decision:** `/onboarding/context` (and onboarding generally) is protected: if no session, redirect to login.  
**Rationale:** Onboarding writes user-specific data; must require authenticated user id.  
**Alternatives Considered:** Anonymous onboarding: deferred (complicates data ownership).  
**Tradeoffs & Risks:** Must ensure login actually creates usable session.  
**Impact on V1:** Clean user-data model.

---

## 2025-12-31-ONBOARD-002 — V1 onboarding is 3 steps focused on signal, not fluff
**Area:** UX / Product  
**Decision:** Onboarding captures (1) context, (2) direction, (3) patterns/constraints.  
**Rationale:** These fields create enough signal to power early personalization without overwhelming users.  
**Alternatives Considered:**
- Longer questionnaire: deferred (too heavy, risks dropoff)
- Shallow onboarding: rejected (not enough signal for intelligence)
**Tradeoffs & Risks:** Must ensure each step feels calm and valuable.  
**Impact on V1:** Creates a usable profile for personalization engine.

---

## 2025-12-31-ONBOARD-003 — Career stage selection uses pill UI (not shiny multi-select)
**Area:** UX  
**Decision:** Career stage is selected via minimalist pill buttons with defined stage language.  
**Rationale:** Multi-select UI looked “shiny / SaaS / wrong vibe.” Pills match BLACKBOX aesthetic and clarity.  
**Alternatives Considered:** Dropdown/multi-select: rejected (aesthetic mismatch).  
**Tradeoffs & Risks:** Must ensure accessibility and clear active state.  
**Impact on V1:** Better brand-consistent input controls.

---

## 2025-12-31-ONBOARD-004 — Onboarding uses a single sliding “one-page” flow (horizontal)
**Area:** UX / Onboarding  
**Decision:** Steps 1–3 slide horizontally within one route so it feels like one continuous experience.  
**Rationale:** You wanted it to “glide” like one page, not separate page jumps.  
**Alternatives Considered:**
- Separate routes per step: rejected (felt disjointed)
- Vertical scroll: not selected (you chose horizontal)
**Tradeoffs & Risks:** Requires careful container spacing; “touching boxes” issues occurred and were fixed.  
**Impact on V1:** Premium feel; less jarring transitions.

---

## 2025-12-31-ONBOARD-005 — Transition tuning: slower + smoother easing to match calm vibe
**Area:** UX  
**Decision:** Transition duration was intentionally slowed and easing adjusted to feel deliberate (not instantaneous).  
**Rationale:** You couldn’t perceive the transition; you wanted it clearly visible and smooth.  
**Alternatives Considered:** Default quick transitions: rejected.  
**Tradeoffs & Risks:** Too slow can feel sluggish; must balance.  
**Impact on V1:** Stronger “BLACKBOX pacing” identity.

---

## 2025-12-31-ONBOARD-006 — Prevent slide clipping and “touching boxes” by adding proper spacing rules
**Area:** UX / Engineering  
**Decision:** Add layout rules so step panels don’t visually connect during slide (gap/padding/overflow discipline).  
**Rationale:** You reported panels “touching” and looking like a single connected box; this breaks the intended modular feel.  
**Alternatives Considered:** Ignore issue: rejected.  
**Tradeoffs & Risks:** Requires precise CSS structure.  
**Impact on V1:** Cleaner transitions, less visual jank.

---

## 2025-12-31-ONBOARD-007 — Control layout: Back left, Continue center, Skip right
**Area:** UX  
**Decision:** Navigation controls ordered for intuitive flow: back (left), continue (primary), skip (right).  
**Rationale:** Visually and psychologically correct.  
**Alternatives Considered:** Back on far right: rejected.  
**Tradeoffs & Risks:** None.  
**Impact on V1:** Reduced friction.

---

## 2025-12-31-ONBOARD-008 — Onboarding prefill reads from `profiles` to resume safely
**Area:** Engineering / UX  
**Decision:** Onboarding attempts to prefill fields by reading from `profiles` for the logged-in user.  
**Rationale:** Supports resuming onboarding and prevents data loss.  
**Alternatives Considered:** Stateless onboarding: rejected.  
**Tradeoffs & Risks:** Must handle `maybeSingle()` and null values safely.  
**Impact on V1:** Better UX continuity.

---

## 2025-12-31-DATA-001 — Onboarding saves into `profiles` via upsert on `id`
**Area:** Database / Engineering  
**Decision:** Use `profiles.upsert({ id: user.id, email: user.email, ...fields }, { onConflict: "id" })` per step.  
**Rationale:** Simplifies incremental onboarding save without requiring separate onboarding tables.  
**Alternatives Considered:** Separate onboarding tables: deferred (more complexity).  
**Tradeoffs & Risks:** Profiles table may grow; must keep it coherent.  
**Impact on V1:** Faster V1 build; consistent user row.

---

## 2025-12-31-PROCESS-001 — Introduce “Main Focus” header discipline to avoid rabbit holes
**Area:** Process / Execution  
**Decision:** Every working session must begin with a “CURRENT MAIN FOCUS” header so work doesn’t drift into tiny fixes.  
**Rationale:** You noticed time loss from UI micro-fixes; you want constant alignment to V1 build progress.  
**Alternatives Considered:** No discipline: rejected.  
**Tradeoffs & Risks:** None.  
**Impact on V1:** Higher velocity and clarity.

---

## 2025-12-31-PROCESS-002 — Supabase changes are requested/handled as SQL blocks
**Area:** Process / Database  
**Decision:** Any time Supabase changes are needed, provide explicit SQL you can run in Supabase.  
**Rationale:** You want repeatable, copy-paste DB operations without ambiguity.  
**Alternatives Considered:** Click-ops only: rejected (error-prone).  
**Tradeoffs & Risks:** Must ensure SQL is correct and compatible.  
**Impact on V1:** Faster, safer database iteration.

---

## 2025-12-31-PROJ-001 — Split the work into specialized chats under BLACKBOX project folder
**Area:** Process / Collaboration  
**Decision:** Separate chats by discipline (Engineering, Intelligence Design, UX, Scope, Strategy) and keep them cross-consistent via shared Master Context + Decision Log.  
**Rationale:** Prevents messy conversations, maintains clarity, and enables deep work per domain.  
**Alternatives Considered:** Single mega-chat: rejected (too chaotic).  
**Tradeoffs & Risks:** Requires strong logging discipline to avoid divergence.  
**Impact on V1:** Better system building.

---

## 2025-12-31-PROJ-002 — Decision Log becomes the authoritative cross-chat memory
**Area:** Process / Governance  
**Decision:** The Decision Log is the official source of truth; each chat outputs “Decision Log–ready text” after major conclusions.  
**Rationale:** Cross-referencing chats requires a durable memory system.  
**Alternatives Considered:** Rely on chat memory alone: rejected (unreliable / drift).  
**Tradeoffs & Risks:** Manual paste required (unless later automated).  
**Impact on V1:** Prevents rework and scope drift.

---

## 2025-12-31-INTEL-001 — Lock the next build milestone: Interpretation Layer before more UI/features
**Area:** Intelligence Design / Product  
**Decision:** Next major milestone is designing the V1 “Interpretation Layer” (how BLACKBOX thinks from onboarding signals) before building more dashboards/features.  
**Rationale:** Without interpretation, tasks and dashboards become generic and “lame.”  
**Alternatives Considered:** Jump straight to tasks UI: rejected (low differentiation).  
**Tradeoffs & Risks:** Requires careful conservative inference design.  
**Impact on V1:** Enables true personalization foundation.

---

## 2025-12-31-ENG-006 — Confirm local dev discipline: restart `npm run dev` after structural changes
**Area:** Engineering / Workflow  
**Decision:** If pages/routes/env/config change, restart dev server to ensure Next.js picks up changes correctly.  
**Rationale:** Page 2 “didn’t load” until server restart.  
**Alternatives Considered:** Keep debugging without restart: rejected (wastes time).  
**Tradeoffs & Risks:** None.  
**Impact on V1:** Faster debugging.

---

## 2025-12-31-SCOPE-001 — Onboarding is the foundation for learning behavior patterns (V1 direction)
**Area:** Product / Intelligence  
**Decision:** V1 intelligence is anchored in learning WHY strategies work for an artist and learning behavior patterns over time, not just spitting tasks.  
**Rationale:** This is the core differentiator: “knows why,” learns patterns, reduces friction.  
**Alternatives Considered:** Output-only planner: rejected (not BLACKBOX).  
**Tradeoffs & Risks:** Behavior learning requires careful logging + feedback loops later.  
**Impact on V1:** Sets direction for reflections + loop design.

2026-01-02 — BLACKBOX Dashboard Typography System LockedTypography System:

Font: IBM Plex Mono for all text (full monospace)
All text: uppercase (text-transform: uppercase)
Section headers: 500 weight, 12px, 0.2em letter-spacing, #6b6b6b
Labels: 500 weight, 11px, 0.25em letter-spacing, #6b6b6b
Body text: 300 weight (light), 14px, 0.05em letter-spacing, line-height 1.7, #e5e5e5
Data values/emphasis: 400 weight, 14px, 0.04em letter-spacing, #ffffff
Small text: 300 weight, 12px, 0.05em letter-spacing, italic for empty states, 

---



# Backfill Notes (What exists but is NOT yet locked as a decision)
The following items were discussed or partially implemented but should only be logged as decisions once finalized:

- Dashboard route and design (`/dashboard`) structure
- Full task generation logic tied to onboarding signals (beyond n8n release generator)
- Reflections UI and when it triggers
- Whether email confirmation stays ON or OFF in Supabase auth settings
- Final schema for brand profiles + releases beyond onboarding fields




---

# How to Add New Entries
Append new decisions using this format:

### Decision ID  
`YYYY-MM-DD-AREA-###`

### Title  
…

### Area  
…

### Decision  
…

### Rationale  
…

### Alternatives Considered  
…

### Tradeoffs & Risks  
…

### Impact on V1  
…

### Notes  
…

---