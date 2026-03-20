# BLACKBOX — Cursor Rules
# Read this before making ANY change to the codebase.

---

## FIRST: read these files before starting work
- /docs/LIVE_SCHEMA_SOURCE_OF_TRUTH.md — DB schema authority
- /docs/SESSION_START.md — architecture overview
- /docs/LAUNCH_CHECKLIST.md — current state and priorities

---

## CORE RULES

### 1. Surgical changes only
- Change the minimum number of files needed
- State which files you're changing before changing them
- Never refactor or reorganize code that wasn't asked about
- If a change requires touching more than 3 files, ask first

### 2. Design system — never invent new styles
- Background: #0c0c0e
- Mission card: #131315
- Secondary cards / console: #111113
- Card borders: rgba(255,255,255,0.08)
- Card border-radius: 4px
- Pill border-radius: 6px
- Directive text (NEXT MOVE): font-inter font-black
- Labels / metadata: font-mono (IBM Plex Mono)
- All tokens in: lib/design-system.ts

Before adding any new color, spacing, or component style:
→ Check if it already exists in lib/design-system.ts
→ If not, use the closest existing value

### 3. Database — never invent fields
- Check /docs/LIVE_SCHEMA_SOURCE_OF_TRUTH.md before any query
- If a field doesn't exist there, it doesn't exist in the DB
- State "DATABASE CHANGES REQUIRED" if new fields are needed
- Never use .select('*') in production queries — always list fields

### 4. Campaign module boundary
- All campaign logic lives in lib/modules/campaign/
- intelligence.ts — pure functions only, no async, no DB
- state.ts — resolveCampaignState — pure function
- actions.ts — server actions with 'use server'
- generate/ — Claude API generators, return plain text or structured data
- Never put business logic in page.tsx or components

### 5. AI output rule
- AI generates → stored in DB → UI reads from DB
- Never render AI output directly in UI without persisting first
- content_pieces table = all AI-generated assets
- campaign_tasks table = all AI-generated tasks

### 6. Output format
Always output in this format:
1. Which files you're changing and why
2. The changes
3. What to test after

---

## COMPONENT PATTERNS

### Server components (page.tsx)
- Fetch data here
- Pass to client components as props
- Never fetch in client components unless user-triggered

### Client components
- Receive all data as props
- Use server actions for mutations (never fetch API directly)
- Keep state minimal — derive from props where possible

### Server actions
- Always start with auth check: supabase.auth.getUser()
- Always check subscription_status for paid features
- Throw clear error strings for client to handle

---

## WHAT NOT TO DO

- Don't add backdrop-filter or blur effects to workspace/campaign UI
- Don't change border-radius on cards (stays 4px)
- Don't add gradients to backgrounds (stays flat #0c0c0e)
- Don't modify the sliding animation in onboarding (900ms, cubic-bezier)
- Don't change the three-layer workspace structure (Mission / Work / AI)
- Don't merge campaign_tasks and tasks — they are separate systems
- Don't generate tasks like "review your assets in BLACKBOX" — tasks must be real-world actions
