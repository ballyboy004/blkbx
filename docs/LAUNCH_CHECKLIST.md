# BLACKBOX — Launch Checklist
**Updated:** 2026-03-19
**Goal:** 10 paying users at $25/mo Campaign module

---

## STATUS — what's built and working

### Routing & Auth
- ✅ `/dashboard` is the permanent workspace URL (no UUID exposed to users)
- ✅ `/campaign/:path*` redirects to `/dashboard`
- ✅ Middleware protects all routes — unauthenticated → `/` with `redirectTo` param
- ✅ Future modules pre-wired in middleware: `/analytics`, `/releases`, `/contacts`

### Onboarding
- ✅ Adaptive role-based panels (artist / producer / both / songwriter)
- ✅ GSAP assembly animations — title surfaces, description follows, pills stagger in
- ✅ Pills drop into place with organic stagger (PillGrid + data-pill + GSAP)
- ✅ StepCounter animates on each step change
- ✅ Interpretation panel — Sonnet-powered, 3 punchy sentences, rendered as paragraphs
- ✅ "Enter BLACKBOX" button → `window.location.assign` (no animation, clean)
- ✅ Dev reset route: `GET /dev/reset` (local only, blocked in production)

### Campaign Workspace
- ✅ Mission card — CURRENT MISSION + NEXT MOVE directive + progress bar
- ✅ DirectiveText — GSAP `expo.out` slide from right with subtle rotateY tilt
- ✅ MilestoneLabel — GSAP slide from right
- ✅ DONE / SKIP buttons — wired to `completeTask` server action
- ✅ Optimistic UI — title updates instantly from `allTasks` array before refresh
- ✅ Task completion advances NEXT MOVE correctly
- ✅ `resolveCampaignState` — milestone-aware, `PHASE_ORDER` sort matches client sort
- ✅ `pendingTasks` array in dashboard/page.tsx sorted by PHASE_ORDER + order_index
- ✅ Staggered workspace entry (Framer Motion springs on mission/work/chips)
- ✅ Work card — READY FOR REVIEW items with layout animation on remove
- ✅ Action chips — GSAP hover (border + background activate, no scale/movement)
- ✅ "Start next release" chip when `isComplete` → routes to `/onboarding`

### AI Drawer
- ✅ Input bar always fixed at bottom — same styling always, never changes
- ✅ Drawer opens as centered card panel (`max-w-[600px]`, `bottom: 80px` above input)
- ✅ Scrim with `blur(2px)` behind drawer
- ✅ Spring entry animation (`scale: 0.98 → 1`)
- ✅ Autoscroll on new messages (50ms timeout)
- ✅ User messages as dim uppercase labels, assistant as formatted content
- ✅ Close via button or scrim click

### Intelligence Layer
- ✅ `completeTask` server action — writes `done`/`skipped` to `campaign_tasks`
- ✅ `upsertIntelligenceContext` — upsert with `onConflict: 'user_id'` (race-safe)
- ✅ `normalizeTaskType` — maps task titles to type keys (short_video, playlist_pitch, etc.)
- ✅ `completion_rate` + `skip_patterns` + `preferred_task_types` written on every action
- ✅ Adaptive task generation — reads `skip_patterns` from `intelligence_context` before generating
- ✅ Task generator injects skip patterns into system prompt (avoids repeated skips)

### Asset Generation
- ✅ `generateAssets` parallelized with `Promise.all` (~4x faster)
- ✅ Asset review screen — approve / edit / regenerate / reject
- ✅ `approveAsset` / `rejectAsset` locked to correct `campaign_id`

### Code Quality Fixes (this session)
- ✅ Removed redundant `getCampaign` call in dashboard/page.tsx
- ✅ Dead `PROTECTED_PATHS` array removed from middleware.ts
- ✅ `upsertIntelligenceContext` race condition fixed (upsert vs select+insert)
- ✅ `optimisticTitle` / `optimisticMilestone` state replaces fragile index approach
- ✅ `useEffect` clears optimistic state when `nextTaskId` changes from server refresh

---

## KNOWN ISSUES / PENDING FIXES

### 1. DIRTY TEST DATA — run in Supabase SQL editor
The test campaign (id: `14824eb8-ae33-4ed7-813e-7863ac95597b`) has tasks
incorrectly marked done/skipped from earlier buggy optimistic updates.
```sql
UPDATE campaign_tasks
SET status = 'pending', completed_at = NULL
WHERE campaign_id = '14824eb8-ae33-4ed7-813e-7863ac95597b'
AND parent_id IS NOT NULL;
```
Also: `genre_sound` on test profile is garbled (multiple sessions concatenated).
```sql
UPDATE profiles
SET genre_sound = 'dark r&b, moody and cinematic'
WHERE email = 'test@gmail.com';
```

### 2. TASK TITLE JUMP BUG — may still occur
After optimistic fix, there's a brief moment where optimistic title shows,
then server data arrives and may differ. Watch for this in testing.
If it reoccurs: the `useEffect` clearing on `nextTaskId` change is the guard —
verify it's firing correctly after refresh.

---

## BLOCKERS FOR LAUNCH (in priority order)

### 1. STRIPE — not started
**Samuel does first:** Create Stripe account → New Product → "BLACKBOX Campaign" $25/mo recurring
Get: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`
Full Cursor prompt is preserved below — unchanged, ready to use.

### 2. FULL FLOW TEST — never completed end-to-end
After resetting test data above, run through as a real user:
```
/dev/reset → full onboarding → land at /dashboard
→ BUILD CAMPAIGN PLAN → verify NEXT MOVE shows correct first task
→ DONE a few tasks → verify title updates correctly, progress ticks
→ SKIP a task → verify skipped correctly, next task appears
→ GENERATE CAMPAIGN ASSETS → verify assets appear in READY FOR REVIEW
→ Click REVIEW on an asset → approve / edit / regenerate / reject
→ Verify workspace updates after each action
```

### 3. CURATOR PITCH — announcement.ts needs replacing
`generate/announcement.ts` generates a vague statement. Replace with curator pitch.

**Changes needed:**
- Rewrite `generate/announcement.ts` system prompt for curator pitch format
- Update `ContentPieceType`: add `'curator_pitch'`, keep `'announcement'` for compat
- Update `ASSET_LABELS` in `intelligence.ts` and `AssetReviewScreen.tsx`
- DB: add `'curator_pitch'` to `content_pieces.type` check constraint

**Curator pitch format:**
- Opening: why this song fits their specific playlist
- Sound description: genre, mood, key influences
- Artist context: 1-2 sentences, credibility-focused
- Streaming link: [LINK PLACEHOLDER]
- CTA: simple, direct ask

---

## STRIPE CURSOR PROMPT (send after getting keys)

```text
Build Stripe payment integration. Install stripe package first.
Three new files, one update to actions.ts.

ENV VARS needed (add to Railway + .env.local):
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  NEXT_PUBLIC_APP_URL  (e.g. https://yourapp.railway.app)

───────────────────────────────────────────
FILE 1 — app/api/stripe/checkout/route.ts
───────────────────────────────────────────

POST handler. Creates Stripe Checkout session.

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? '',
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'BLACKBOX Campaign',
          description: 'Release campaign infrastructure for independent artists.',
        },
        unit_amount: 2500,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?cancelled=true`,
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}

───────────────────────────────────────────
FILE 2 — app/api/stripe/webhook/route.ts
───────────────────────────────────────────

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const userId = session.metadata?.supabase_user_id
    if (userId && session.subscription) {
      await supabase.from('profiles').update({
        subscription_status: 'active',
        stripe_subscription_id: session.subscription as string,
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const { data: profile } = await supabase.from('profiles')
      .select('id').eq('stripe_customer_id', sub.customer as string).single()
    if (profile) {
      await supabase.from('profiles').update({
        subscription_status: sub.status === 'active' ? 'active' : 'cancelled',
      }).eq('id', profile.id)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const { data: profile } = await supabase.from('profiles')
      .select('id').eq('stripe_customer_id', sub.customer as string).single()
    if (profile) {
      await supabase.from('profiles').update({ subscription_status: 'cancelled' })
        .eq('id', profile.id)
    }
  }

  return NextResponse.json({ received: true })
}

───────────────────────────────────────────
FILE 3 — app/upgrade/page.tsx
───────────────────────────────────────────

'use client'
import { useState } from 'react'

export default function UpgradePage() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: '#0c0c0e' }}>
      <div className="max-w-[480px] w-full space-y-8">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-600">BLACKBOX</p>
          <h1 className="font-inter font-black text-[32px] text-white leading-tight tracking-tight">
            Campaign Module
          </h1>
          <p className="font-mono text-[13px] text-zinc-400 leading-relaxed">
            Release infrastructure for independent artists. Generate your campaign plan,
            create assets, and execute your rollout.
          </p>
        </div>

        <div className="p-6 space-y-4"
          style={{ background: '#131315', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
          <div className="flex items-baseline gap-1">
            <span className="font-inter font-black text-[40px] text-white">$25</span>
            <span className="font-mono text-[13px] text-zinc-500">/month</span>
          </div>
          <ul className="space-y-2">
            {[
              'Personalized campaign plan (milestones + tasks)',
              'AI-generated assets (curator pitch, captions, email)',
              'Asset review and approval workflow',
              'Campaign execution guidance',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="font-mono text-[11px] text-zinc-600 mt-0.5">—</span>
                <span className="font-mono text-[12px] text-zinc-400">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <button type="button" onClick={handleUpgrade} disabled={loading}
          className="w-full h-12 font-inter font-black text-[14px] uppercase tracking-tight text-black disabled:opacity-50"
          style={{ background: 'white', borderRadius: '4px' }}>
          {loading ? 'Loading...' : 'Get Campaign Access'}
        </button>

        <p className="font-mono text-[11px] text-zinc-700 text-center">
          Cancel anytime. No contracts.
        </p>
      </div>
    </div>
  )
}

───────────────────────────────────────────
FILE 4 — Update lib/modules/campaign/actions.ts
───────────────────────────────────────────

Add subscription check to generateCampaignTasks and generateAssets.
After getting the user in each function, add:

  const { data: profileCheck } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  if (profileCheck?.subscription_status !== 'active') {
    throw new Error('SUBSCRIPTION_REQUIRED')
  }

───────────────────────────────────────────
Also update WorkspaceScreen.tsx to handle SUBSCRIPTION_REQUIRED error:

In handleChipAction catch blocks for 'generate' and 'generate_assets',
check if error message is 'SUBSCRIPTION_REQUIRED':

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'SUBSCRIPTION_REQUIRED') {
      window.location.href = '/upgrade'
    } else {
      setMessages(m => [...m, { role: 'assistant', content: 'Failed. Try again.' }])
    }
  }
───────────────────────────────────────────
```

---

## CAMPAIGN INTELLIGENCE — FEATURE ROADMAP
**Decided:** 2026-03-19 — Product strategy session
**Goal:** Shift campaign from advisor → execution tool

### 1. TASK-LEVEL AI CONTEXT (highest leverage)
Every task should be expandable. Tapping a task opens a contextual brief — not a generic description, but actionable execution guidance generated from the user's profile + campaign context.
- UI: task row expands on tap, shows AI-generated brief inline
- Brief is generated once and cached on first open (stored on `campaign_tasks.ai_context` or `content_pieces` with task reference)
- Brief format: HOW to execute this specific task for this specific artist — not general advice
- AI drawer should auto-inject current task context so user can go deeper without explaining anything
- No new screen — inline expansion only

### 2. DELIVERABLE TRACKING PER TASK
Tasks currently go done/skip with no record of output. Some tasks produce real things.
- DB: add optional `deliverable_url` or `deliverable_note` field on `campaign_tasks`
- UI: after marking DONE, prompt "Add a link or note?" — optional, dismissible
- Completed tasks with deliverables show a small indicator in the workspace
- Feeds into the intelligence layer — tasks with deliverables = high-confidence completion signals
- Enables future analytics: what did this campaign actually produce?

### 3. PACE / MOMENTUM INTELLIGENCE
Progress bar shows a number. It should show whether the user is on track relative to release date.
- `resolveCampaignState` already has `completedTasks`, `totalTasks`, `releaseDate`
- Add `paceStatus: 'on_track' | 'at_risk' | 'behind' | 'no_date'` to `CampaignState`
- Derive from: days until release ÷ tasks remaining vs. historical completion rate
- Surface in Mission card as a secondary label (e.g. "ON TRACK" / "FALLING BEHIND")
- AI drawer chip: "Am I on pace?" — system answers with authority from pace data

### 4. ADAPTIVE REPLANNING (mid-campaign) ✅ BUILT
- ✅ `checkAdaptiveTrigger` — counts skipped task types, returns trigger if any hits 3+
- ✅ `replanCampaign` — deletes pending sub-tasks + orphaned milestones, regenerates with skip patterns injected
- ✅ "Adjust plan" chip surfaces when trigger fires (via `shouldSuggestReplan` in dashboard/page.tsx)
- ✅ Confirmation flow in AI drawer — user must confirm before replan executes
- ✅ Done/skipped tasks untouched — pending only

### 5. CONTEXT-AWARE AI DRAWER
Drawer currently has no awareness of which task the user is looking at.
- Pass `currentTaskId` + `currentTaskTitle` into the drawer context
- `buildWorkspaceSystemPrompt` already has task context — surface it as active in the drawer header (e.g. "Re: Pitch to playlist curators")
- Auto-inject a primer when drawer opens on a task: "I can help you execute this. What do you need?"
- Chips in drawer should be task-contextual, not static

---

## NICE TO HAVE (post first 10 users)

- ENVIRONMENT / MOTION SYSTEM PASS — full platform motion audit using GSAP + Framer to their potential: mousemove card tilt, depth shadows, ambient idle motion, fog-lift on focus. Decisions logged in DECISIONS_LOG.md 2026-03-19.
- CURRENT MISSION subtitle truncation — long `genre_sound` values overflow
- Error states — no user-facing errors if generation fails
- Loading skeleton while generating tasks/assets
- New campaign form styling — doesn't match workspace aesthetic
- `completed_at` timestamp on skipped tasks (currently null — add if analytics needed)
