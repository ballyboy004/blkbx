# BLACKBOX V1 Database Documentation

## Overview

BLACKBOX uses Supabase (PostgreSQL) with Row Level Security (RLS) for multi-tenant data isolation.

**Active Tables (V1):**
- `profiles` - User profile data from onboarding
- `tasks` - User task management

**Defined but Inactive (V1+):**
- `releases` - Release tracking (schema exists, not wired to UI)
- `reflections` - Post-release learning (schema exists, not wired to UI)

**Legacy/Deprecated:**
- `artist_context` - Redundant with profiles, should be dropped

---

## Security Model

**Authentication:** Supabase Auth (email/password)  
**Authorization:** Row Level Security (RLS) policies on all tables  
**Ownership:** All user data linked via `user_id` = `auth.uid()`

### RLS Status Checklist

✅ **MUST BE ENABLED:**
- [ ] `profiles` table RLS enabled
- [ ] `tasks` table RLS enabled
- [ ] Policies enforce `auth.uid() = user_id` for all operations

⚠️ **SHOULD BE ENABLED (when features activate):**
- [ ] `releases` table RLS enabled
- [ ] `reflections` table RLS enabled

**Verification Command (run in Supabase SQL Editor):**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'tasks', 'releases', 'reflections');
```

Expected result: `rowsecurity = true` for all tables.

---

## Current Data Flow (V1)

### 1. User Signup
```
auth.signUp() → auth.users row created → profiles row created (id = user.id)
```

### 2. Onboarding
```
Step 1 (Context) → upsert profiles.context
Step 2 (Direction) → upsert profiles.primary_goal, genre_sound, career_stage
Step 3 (Patterns) → upsert profiles.strengths, weaknesses, constraints, current_focus
                  → set onboarding_completed = true
```

### 3. Dashboard Load
```
Read profiles → buildMirror() → generate interpretation
Check for pending "today" task → if none, create one based on current_focus
Display personalized dashboard
```

### 4. Task Completion
```
User clicks complete/skip → update tasks.status → redirect to dashboard
Next load → generates new task if none pending
```

---

## Key Fields Reference

### profiles
| Field | Type | Required | V1 Usage | Notes |
|-------|------|----------|----------|-------|
| `id` | uuid | ✅ | Primary key | = auth.users.id |
| `email` | text | ✅ | Display, lookup | From auth.users |
| `context` | text | ❌ | Mirror identity | Step 1 onboarding |
| `primary_goal` | text | ❌ | Mirror strategy | Step 2 onboarding |
| `genre_sound` | text | ❌ | Mirror identity | Step 2 onboarding |
| `career_stage` | text | ❌ | Mirror context | Step 2 onboarding |
| `strengths` | text | ❌ | Mirror patterns | Step 3 onboarding |
| `weaknesses` | text | ❌ | Mirror patterns | Step 3 onboarding |
| `constraints` | text | ❌ | Mirror guardrails | Step 3 onboarding |
| `current_focus` | text | ❌ | Task generation | Step 3 onboarding |
| `onboarding_completed` | boolean | ✅ | Route guard | Set on step 3 finish |
| `onboarding_completed_at` | timestamp | ❌ | Analytics | Set on step 3 finish |

**Unused fields (cleanup candidate):**
- `genre` (use `genre_sound` instead)
- `release_phase` (not implemented)

### tasks
| Field | Type | Required | V1 Usage | Notes |
|-------|------|----------|----------|-------|
| `id` | uuid | ✅ | Primary key | Auto-generated |
| `user_id` | uuid | ✅ | RLS enforcement | Links to auth.users |
| `task_name` | text | ✅ | Display | "capture one idea seed" |
| `kind` | text | ❌ | Filter logic | "today", "user" |
| `source` | text | ❌ | Audit trail | "system", "user" |
| `priority` | integer | ❌ | Future sorting | 1-5 (unused in V1) |
| `status` | text | ✅ | Lifecycle | "pending", "completed", "skipped" |

**Unused fields (cleanup candidate):**
- `title` (redundant with `task_name`)
- `purpose`, `guardrail`, `suggestion` (not displayed yet)
- `phase`, `due_date` (not enforced)

---

## Schema Cleanup Recommendations

**Priority 1 (Safety):**
1. ✅ Verify RLS is enabled on `profiles` and `tasks`
2. ✅ Test that users can only access their own data

**Priority 2 (Cleanup):**
1. Drop `artist_context` table (unused, redundant)
2. Remove `genre` and `release_phase` from `profiles`
3. Remove `title` from `tasks` (use `task_name`)

**Priority 3 (Optimization):**
1. Add indexes on frequently queried fields (see schema.sql)
2. Add NOT NULL constraints where appropriate
3. Add enum check constraints for controlled vocabulary fields

---

## Migration Strategy

**Current State:** Schema has evolved organically, contains unused fields and tables.

**Recommended Approach:**
1. Document current schema (✅ complete)
2. Verify RLS policies work correctly (⏳ next step)
3. Test with real user flow end-to-end (⏳ next step)
4. Create cleanup migration script (future)
5. Apply cleanup in V1.1 (future)

**Do NOT cleanup until:**
- V1 is live and tested
- User data is backed up
- RLS is verified working

---

## Verification Commands

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- Count records by table
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'releases', COUNT(*) FROM releases
UNION ALL
SELECT 'reflections', COUNT(*) FROM reflections;
```

---

## Questions to Verify

Before deploying to production:

1. ✅ Can users only see their own profile data?
2. ✅ Can users only see/edit their own tasks?
3. ⏳ What happens if a user deletes their account? (CASCADE configured?)
4. ⏳ Are there any orphaned records in the database?
5. ⏳ Are indexes created for performance?

---

## Related Documentation

- Full schema DDL: `docs/schema.sql`
- Build instructions: `BLACKBOX_V1_BUILD_INSTRUCTIONS.rtf`
- Decision log: `BLACKBOX_DECISION_LOG.md`
