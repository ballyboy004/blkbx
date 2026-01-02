# Intelligence Layer Setup Guide

**Date:** 2026-01-01  
**Status:** Phase 1 Implementation Complete  
**Next:** Database migration + API key setup + testing

---

## What Was Built

✅ **Core intelligence service files:**
- `lib/intelligence/prompts.ts` - System prompts (BLACKBOX voice)
- `lib/intelligence/claude.ts` - Claude API client with rate limiting
- `lib/intelligence/validate.ts` - Quality validation rules
- `lib/intelligence/interpret.ts` - Main interpretation service
- `lib/intelligence/cache.ts` - Caching layer with profile hashing
- `lib/intelligence/index.ts` - Public exports

✅ **Database migration:**
- `supabase/migrations/20260101_create_interpretations.sql`
- Creates `interpretations` table for caching
- Creates `intelligence_costs` table for cost tracking
- Includes RLS policies

---

## Setup Steps

### Step 1: Install Anthropic SDK

```bash
cd /Users/samuelgilmore/Documents/v0-blackbox-login-page-main
npm install @anthropic-ai/sdk
```

### Step 2: Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### Step 3: Add API Key to Environment

Edit `.env.local`:

```bash
# Existing Supabase keys
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Add this:
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Important:** Restart your dev server after adding the key:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Run Database Migration

**In Supabase SQL Editor**, run the migration file:

```sql
-- Copy the entire contents of:
-- supabase/migrations/20260101_create_interpretations.sql

-- And paste into Supabase SQL Editor, then run it
```

**Verify migration succeeded:**

```sql
-- Should return 2 tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('interpretations', 'intelligence_costs');
```

### Step 5: Verify RLS Policies

```sql
-- Should show policies for interpretations table
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'interpretations';
```

---

## Testing the Intelligence Layer

### Create a Test Endpoint

Create `app/api/test-intelligence/route.ts`:

```typescript
// Test endpoint for intelligence layer
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCurrentRead } from '@/lib/intelligence'
import { getCachedInterpretation, cacheInterpretation } from '@/lib/intelligence'

export async function GET() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  try {
    // Check cache first
    const cached = await getCachedInterpretation(user.id, profile)
    
    if (cached) {
      return NextResponse.json({
        source: 'cache',
        currentRead: cached.current_read,
        generatedAt: cached.generated_at,
        cost: `$${cached.cost_usd}`,
      })
    }

    // Generate new interpretation
    const result = await generateCurrentRead(profile)

    // Cache it
    await cacheInterpretation(user.id, profile, result)

    return NextResponse.json({
      source: 'generated',
      currentRead: result.currentRead,
      valid: result.valid,
      cost: `$${result.cost.toFixed(4)}`,
      tokens: {
        input: result.usage.inputTokens,
        output: result.usage.outputTokens,
      },
    })
  } catch (error) {
    console.error('Intelligence test error:', error)
    return NextResponse.json(
      { error: 'Failed to generate interpretation', details: String(error) },
      { status: 500 }
    )
  }
}
```

### Test It

1. **Log in as User A** (samuelgilmore25)
2. **Visit:** `http://localhost:3000/api/test-intelligence`
3. **Expected output:**

```json
{
  "source": "generated",
  "currentRead": "You're trying to thread a needle: build TikTok discovery while protecting the scarcity that makes dark R&B compelling...",
  "valid": true,
  "cost": "$0.0032",
  "tokens": {
    "input": 645,
    "output": 98
  }
}
```

4. **Refresh the page** - should now say `"source": "cache"` (no new API call)

---

## Validation Checklist

✅ **Before proceeding, verify:**

- [ ] Anthropic SDK installed (`npm list @anthropic-ai/sdk`)
- [ ] API key in `.env.local` and dev server restarted
- [ ] Migration ran successfully (tables exist)
- [ ] RLS policies created (verified via SQL)
- [ ] Test endpoint returns valid Current Read
- [ ] Second request uses cache (no duplicate API call)
- [ ] Current Read feels distinctly BLACKBOX (no hype, observational)
- [ ] Validation passes (no banned phrases)

---

## Troubleshooting

### Error: "ANTHROPIC_API_KEY is not set"
- Verify `.env.local` has the key
- Restart dev server (`npm run dev`)
- Check for typos in variable name

### Error: "relation 'interpretations' does not exist"
- Migration didn't run
- Run the SQL migration in Supabase SQL Editor

### Error: Rate limit exceeded
- You're making >40 req/min
- Rate limiter will queue requests automatically
- Check console for wait messages

### Current Read feels generic / has banned phrases
- Check output against validation rules
- Regenerate should fix it (max 2 retries)
- If persistent, escalate to Intelligence Design chat

### API costs higher than expected
- Check `intelligence_costs` table for breakdown
- Verify caching is working (should reuse interpretations)
- Profile changes trigger regeneration (expected)

---

## Next Steps (After Testing)

Once intelligence layer is validated:

**Phase 3: Dashboard Integration**
1. Replace `buildMirror()` in `lib/dashboard/mirror.ts`
2. Update dashboard to use intelligent Current Read
3. Handle loading/error states gracefully

**Phase 4: Weekly Refresh Automation**
1. Create Supabase Edge Function for auto-refresh
2. Schedule via cron (Sunday 2am PT)

**Phase 5: Task Generation (Future)**
1. Implement task generation prompt
2. Wire up to task system
3. Test task quality

---

## Cost Monitoring

**Query current month costs:**

```sql
SELECT 
  COUNT(DISTINCT user_id) as active_users,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_operation
FROM intelligence_costs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE);
```

**Expected costs (V1):**
- Per interpretation: ~$0.003
- Per user per month: ~$0.02 (with caching)

---

## Success Criteria

**Intelligence layer is successful when:**

✅ User reads dashboard and says: **"This actually gets me"**  
✅ Current Read references specific user words/constraints  
✅ Voice is observational, not motivational  
✅ Validation passes consistently  
✅ Caching reduces API calls by ~85%  
✅ Costs match projections (~$0.02/user/month)

---

**Ready to start testing?**

1. Install SDK
2. Add API key
3. Run migration
4. Create test endpoint
5. Visit test URL
6. Verify output quality
