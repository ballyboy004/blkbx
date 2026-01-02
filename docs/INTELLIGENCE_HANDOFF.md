# BLACKBOX V1 Intelligence Layer — Context Handoff

**Date:** 2026-01-01  
**From:** Engineering & Systems Architecture  
**To:** Intelligence & Reasoning Design  
**Purpose:** Design the V1 interpretation layer that makes BLACKBOX feel intelligent

---

## Current V1 State

### What's Built & Working

**Authentication & Onboarding:**
- ✅ Email/password auth via Supabase
- ✅ 3-step horizontal slider onboarding at `/onboarding`
- ✅ Route guards (middleware + component level)
- ✅ Profile data captured across 3 steps:
  - Step 1: `context` (free text about who they are)
  - Step 2: `primary_goal`, `genre_sound`, `career_stage`
  - Step 3: `strengths`, `weaknesses`, `constraints`, `current_focus`
- ✅ Sets `onboarding_completed = true` on finish
- ✅ Redirects to dashboard

**Security:**
- ✅ Row Level Security (RLS) verified working
- ✅ Multi-tenant data isolation confirmed
- ✅ Users can only see their own data

**Database Schema:**
- ✅ `profiles` table (active, onboarding data)
- ✅ `tasks` table (active, V1 task management)
- ✅ `releases`, `reflections` tables (defined but not wired yet)
- ✅ Full schema documented in `docs/schema.sql`

**Dashboard (Current State):**
- ✅ Loads at `/dashboard`
- ✅ Shows personalized empty state
- ✅ Uses `buildMirror()` function for interpretation
- ✅ Generates one "today" task per user
- ✅ Displays: profile snapshot, patterns, today task, context, next actions

---

## The Problem: Current Intelligence Is Not Intelligent

### What We Have Now

**File:** `lib/dashboard/mirror.ts`

**Function:** `buildMirror(profile: Profile)` 

**How it works:**
1. Takes onboarding profile data
2. Runs keyword matching on text fields
3. Applies template logic
4. Returns structured interpretation object

**Example current logic:**
```typescript
// Keyword matching for strategy bullets
if (hasAny(context, ["scarcity", "not overly present"])) {
  strategyBullets.push("presence strategy: scarce / intentional")
}

if (hasAny(constraints, ["burn out", "burnout"])) {
  guardrail = "guardrail: one output only. stop while it's still clean."
}
```

**Task generation:**
```typescript
// Maps current_focus keywords to phase number (1-6)
// Phase number maps to generic task title
// Example: "record" keyword → phase 3 → "record one demo take"
```

### Why This Doesn't Work

**It feels mechanical because:**
- Template matching can't synthesize nuance
- Tasks are generic (not personalized to their specific situation)
- No actual "thinking" or interpretation happening
- Reasoning is hardcoded, not adaptive
- Can't capture tension/opportunity in their context

**Example of the gap:**

**User onboarding input:**
- Context: "I'm a dark R&B artist, focused on moody atmospheric sound. I care about scarcity and not being overly present."
- Primary goal: "Build TikTok discovery while maintaining mystique"
- Constraints: "2 hours/day, I burn out if I post daily"
- Current focus: "Release my first single but overthinking the rollout"

**Current output:**
```
Identity: "I'm a dark R&B artist, focused on moody..."
Strategy: "presence strategy: scarce / intentional"
Today task: "capture one idea seed"
Guardrail: "one output only. stop while it's still clean."
```

**What it SHOULD output:**
```
Current Read: 
"You're trying to thread a needle: build TikTok presence without 
sacrificing the scarcity that makes your work compelling. The tension 
is real - dark R&B thrives on mystique, but discovery demands visibility. 
Your overthinking on the rollout is the actual block, not the strategy."

Today Task: 
"Post one 15-second TikTok snippet of your single's hook with no caption"

Reasoning:
"You said you burn out from daily posting and overthink rollouts. One 
intentional post beats a perfect plan you never execute. The scarcity 
you want comes from quality + silence, not hiding. Let the sound speak."

Guardrail:
"One post this week. Not daily. Mystique = knowing when to be quiet."
```

**See the difference?**
- First one: Echoes their words back
- Second one: Actually interprets the tension and suggests strategic direction

---

## V1 Intelligence Requirements

### Non-Negotiables

**BLACKBOX voice must:**
- ❌ NOT motivate or hype ("You got this! 🚀")
- ❌ NOT use productivity culture language ("crush your goals")
- ❌ NOT be generic AI assistant vibes ("I'm here to help!")
- ✅ BE direct and observational
- ✅ BE grounded in their specific words
- ✅ SURFACE tensions/opportunities they can't see
- ✅ FEEL like someone who deeply gets independent artists

**Tone examples:**

**Wrong:**
- "Great job on completing onboarding! Let's crush those goals together!"
- "You're on an amazing journey! Here's your personalized roadmap to success!"
- "Exciting times ahead! Your TikTok strategy is going to be incredible!"

**Right:**
- "You said you overthink concepts. Voice memos bypass that - they're too raw to overthink."
- "TikTok wants consistency. You burn out from daily posting. One intentional post/week beats forced daily output."
- "Your strength is moody visual storytelling, but you're blocking momentum by perfectionism. Ship the 80% version."

### Core Intelligence Outputs

**1. Current Read (Dashboard Hero)**
- 2-3 sentences
- Synthesizes their context + goal + constraints
- Identifies key tension or strategic opportunity
- Feels personal, not templated

**2. Task Generation**
- Context-aware task tied to their situation
- Clear reasoning that references their specific input
- Small, finishable scope
- Includes guardrail based on actual constraints

**3. Pattern Interpretation**
- Edge: What makes them different (strength)
- Friction: What blocks them (weakness)
- Constraint: Real limitations (time/energy/money)
- Guardrail: Strategic boundary based on constraints

---

## Proposed Architecture

### Intelligence Service Structure

```
lib/intelligence/
  ├── interpret.ts       // Main interpretation logic
  ├── prompts.ts         // System prompts (BLACKBOX voice)
  ├── claude.ts          // Claude API client
  └── cache.ts           // Caching layer
```

### Database Schema Addition

**New table: `interpretations`**
```sql
CREATE TABLE interpretations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Cached interpretation outputs
  current_read text NOT NULL,
  identity_line text,
  strategy_bullets jsonb,  -- array of strings
  pattern_edge text,
  pattern_friction text,
  pattern_constraint text,
  pattern_guardrail text,
  
  -- Metadata
  generated_from_profile_version timestamp,  -- when profile was last updated
  created_at timestamp DEFAULT now(),
  
  UNIQUE(user_id)
);
```

**Why cache?**
- Don't call API on every dashboard load
- Regenerate only when profile changes or weekly refresh
- Massive cost savings (~70% reduction)

### When to Generate/Regenerate

**Generate interpretation:**
- ✅ Onboarding completion (first time)
- ✅ Profile updates (any onboarding field changes)
- ✅ Weekly auto-refresh (keep adaptive)
- ❌ Dashboard page loads (read from cache)

**Generate task:**
- ✅ Task completion/skip (generate next task)
- ✅ No pending task exists (create one)
- ❌ Task already exists (display it)

---

## API Cost Analysis

**Claude Sonnet 4 Pricing:**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Per-operation costs:**
- Dashboard interpretation: ~600 input + 100 output = **$0.003**
- Task generation: ~700 input + 150 output = **$0.004**
- Full profile interpretation: **~$0.007**

**Monthly cost per user (with caching):**
- Onboarding: 1 × $0.007 = $0.007
- Weekly refresh: 4 × $0.003 = $0.012
- Profile updates: ~2 × $0.003 = $0.006
- Task generation: ~8 × $0.004 = $0.032
- **Total: ~$0.06/month per user**

**With prompt caching: ~$0.04/month per user**

**At scale:**
- 100 users: $4/month
- 1,000 users: $40/month
- 10,000 users: $400/month

**As % of revenue (at $20/month pricing):**
- 1,000 users = $20,000 revenue
- API cost = $40 (**0.2%** of revenue)

**Decision: Worth it.**

---

## Technical Implementation Details

### Claude API Integration

**Libraries:**
- Using `@anthropic-ai/sdk`
- Streaming not needed (batch generation)
- Error handling required (API can fail)
- Rate limiting awareness (tier limits)

**Environment variables needed:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Supabase secrets:**
- Store API key in Supabase Vault (not in .env)
- Access via Edge Functions or server-side only

### Caching Strategy

**Flow:**
1. Dashboard loads → Check `interpretations` table
2. If exists + fresh (<7 days old) → Use cached
3. If missing or stale → Generate new
4. Store in `interpretations` table
5. Return to dashboard

**Freshness rules:**
- Generated within last 7 days: Fresh
- Profile updated since last generation: Stale
- Manual refresh requested: Stale

---

## Data Available for Interpretation

### From Profile Table

```typescript
type Profile = {
  // Step 1: Context
  context: string | null           // Free text about who they are
  
  // Step 2: Direction  
  primary_goal: string | null      // Next 90 days goal
  genre_sound: string | null       // How they describe their sound
  career_stage: string | null      // "early", "building", "momentum", etc.
  
  // Step 3: Patterns
  strengths: string | null         // What comes naturally
  weaknesses: string | null        // Where friction shows up
  constraints: string | null       // Time/money/energy limits
  current_focus: string | null     // Next 30 days focus
}
```

**All fields are user-generated free text** (except career_stage which is controlled vocabulary).

### Example Real User Data

**User A (samuelgilmore25):**
```
context: "I'm an independent artist focused on dark atmospheric R&B. 
I value scarcity and intentionality over constant presence."

primary_goal: "Build TikTok discovery without losing mystique"

genre_sound: "dark R&B / moody pop"

career_stage: "building"

strengths: "Visual storytelling, consistent writing, moody aesthetic"

weaknesses: "Overthinking concepts, outreach, posting consistency"

constraints: "2 hours/day max, burn out from daily posting pressure"

current_focus: "Release first single but overthinking the rollout strategy"
```

---

## What We Need From Intelligence Design

### Your Mission

Design the **interpretation layer** that transforms raw onboarding data into intelligent, personalized strategic direction.

**Specifically, design:**

1. **System prompts** that enforce BLACKBOX voice
2. **Interpretation logic** for "Current Read" generation
3. **Task generation strategy** with reasoning
4. **Pattern extraction rules** from onboarding text
5. **Quality guidelines** for what makes a good interpretation

### Key Questions to Answer

1. **Prompt engineering:**
   - What system prompt produces BLACKBOX voice?
   - How do we prevent generic AI assistant tone?
   - How do we ensure grounding in user's specific words?

2. **Interpretation strategy:**
   - What's the algorithm for "Current Read"?
   - How do we identify tension/opportunity?
   - How do we synthesize multiple fields coherently?

3. **Task generation:**
   - How do we move from "current_focus" to specific actionable task?
   - What makes a task feel strategic vs. generic?
   - How do we tie reasoning back to their constraints?

4. **Quality control:**
   - How do we validate interpretation quality?
   - What are red flags (too generic, wrong tone)?
   - How do we handle edge cases (sparse input)?

---

## Success Criteria

**V1 intelligence is successful if:**

✅ Artist reads dashboard and says: **"This actually gets me"**
- Not: "Cool, an AI summary"
- Yes: "Wait, this understands the tension I'm in"

✅ Tasks feel strategic, not generic
- Not: "Post on TikTok daily"
- Yes: "Post one 15-second hook snippet this week - scarcity is your edge, not volume"

✅ Reasoning references their specific situation
- Not: "This will help you grow"
- Yes: "You said you burn out from daily posting - one intentional post beats forced consistency"

✅ Voice is distinctly BLACKBOX
- Not generic AI assistant
- Not productivity culture
- Observational, strategic, grounded

---

## Build Sequence (After Design)

Once you've designed the interpretation layer:

1. Engineering implements system prompts
2. Build Claude API service
3. Create caching layer (`interpretations` table)
4. Replace `buildMirror()` with intelligent interpretation
5. Wire up to dashboard
6. Test with real user data
7. Iterate on prompt quality

---

## Files to Reference

**In project:**
- `lib/dashboard/mirror.ts` - Current deterministic logic (to be replaced)
- `app/dashboard/page.tsx` - Dashboard that consumes interpretation
- `lib/profile/profile.ts` - Profile type definition
- `docs/schema.sql` - Database schema
- `docs/DATABASE.md` - Data flow documentation

**In BLACKBOX project folder:**
- `BLACKBOX_MASTER_CONTEXT.md` - Philosophy and principles
- `BLACKBOX_V1_BUILD_INSTRUCTIONS.rtf` - V1 scope and goals
- `BLACKBOX_DECISION_LOG.md` - All architectural decisions

---

## Starting Point

**Begin with:**

1. Design the system prompt for "Current Read" generation
2. Test it against real user data (User A example above)
3. Iterate until output feels distinctly BLACKBOX

**Goal for first iteration:**
- Get one "Current Read" that feels right
- Then systematize the approach
- Then expand to task generation

---

## Final Context

**Why this matters:**

BLACKBOX's entire value proposition is **intelligence over tactics**. Without real interpretation, it's just a form with a dark UI. The API cost is negligible (~$0.04/user/month). The differentiation is everything.

V1 must prove that BLACKBOX **actually understands the artist** and provides **strategic direction**, not just generic advice.

That's the job of the intelligence layer.

---

**You have everything you need. Design the brain.**
