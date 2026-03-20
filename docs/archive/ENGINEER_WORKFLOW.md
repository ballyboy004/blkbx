# ENGINEER_WORKFLOW.md

Rules for every engineering session. Non-negotiable.

---

## Session Start

1. **Read first**
   - `docs/PROJECT_STATE.md` — what exists
   - `docs/TODO_NEXT.md` — what's planned
   - Any files mentioned in the task

2. **Clarify scope**
   - What exactly is being asked?
   - What files will this touch?
   - What should NOT change?

---

## Before Writing Code

### Assumption Check (3-6 bullets)

Before any code, state your assumptions:

```
Assumptions:
- The history dropdown is in TodayCard.tsx
- Reflections are stored in the tasks table, not a separate table
- The modal already exists, just needs data wired
```

Wait for confirmation if anything is uncertain.

---

## Output Format

Every response should follow this structure:

### 1. Plan
What you're going to do, in 2-3 sentences max.

### 2. Changes
Show only the parts that change. Use this format:

```typescript
// File: /path/to/file.tsx
// Change: [what you're changing]

// BEFORE (lines X-Y):
[old code]

// AFTER:
[new code]
```

Or provide a diff if cleaner.

### 3. State Updates
Note if any docs need updating:
- PROJECT_STATE.md: [yes/no, what changed]
- TODO_NEXT.md: [yes/no, what completed]
- DECISIONS_LOG.md: [yes/no, only if Level-2 decision]

### 4. Quick Tests
How to verify the change works:
```
1. Run `npm run dev`
2. Go to /dashboard
3. Click History dropdown
4. Verify reflections show
```

### 5. Git Commands
```bash
git add -A && git commit -m "Fix reflection display in history dropdown" && git push
```

---

## Rules

### Files > Chat
- Don't ask me to remember things from earlier in the chat
- If you need context, read the file
- If something should be remembered, put it in a doc

### Ask for Missing Snippets
- If you need to see a file to understand the task, ask for it or read it
- Don't guess what's in a file

### Surgical Edits Only
- Change the minimum needed
- Don't refactor unrelated code
- Don't add features that weren't requested

### Match Existing Patterns
- Look at how similar things are done in the codebase
- Match naming conventions
- Match code style

### Don't Touch Without Approval
- `lib/intelligence/framework.ts` — the AI prompt system
- Card styling in components
- Supabase RLS policies
- Database schema

---

## Session End

Always:
1. Provide git commands
2. Update PROJECT_STATE.md if structure changed
3. Update TODO_NEXT.md if tasks completed
4. Update DECISIONS_LOG.md only for Level-2 decisions

---

## What NOT to Do

- Don't rewrite entire files
- Don't add dependencies without asking
- Don't change the design system
- Don't add emojis or bright colors
- Don't use phrases like "Great question!" or "I'd be happy to help!"
- Don't explain things the user already knows
- Don't suggest improvements that weren't asked for
