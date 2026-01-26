# CONTEXT_PACKET_TEMPLATE.md

Use this template when starting a new engineering chat. Copy, fill in, paste.

---

```
## Session Goal
[One sentence: what you want to accomplish]

## Current State
See: /Users/samuelgilmore/Documents/blkbox/docs/PROJECT_STATE.md

Quick summary: [2-3 sentences on where things stand relevant to this task]

## Constraints
- V1 scope only — no new features unless explicitly requested
- Match existing code patterns
- Preserve dark minimal aesthetic
- Don't touch framework.ts without approval

## Files In Scope
[List the specific files this task will touch]
- /path/to/file1.tsx
- /path/to/file2.ts

## Acceptance Criteria
[What "done" looks like — be specific]
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Don't Forget
- Read files before editing
- Make surgical changes only
- Test locally: `npm run dev`
- End with git commands
- Update PROJECT_STATE.md if structure changed
- Update TODO_NEXT.md if tasks completed
- Update DECISIONS_LOG.md only for Level-2 decisions
```

---

## Example Usage

```
## Session Goal
Fix the history dropdown not showing past task reflections.

## Current State
See: /Users/samuelgilmore/Documents/blkbox/docs/PROJECT_STATE.md

V1 is complete. History dropdown exists but reflections aren't displaying even when they exist in the database.

## Constraints
- V1 scope only
- Match existing code patterns
- Don't change the dropdown styling

## Files In Scope
- /components/dashboard/TodayCard.tsx
- /lib/intelligence/history.ts
- /app/dashboard/page.tsx

## Acceptance Criteria
- [ ] Reflections show in history dropdown when they exist
- [ ] Empty state shows correctly when no reflection
- [ ] Modal displays reflection in detail view

## Don't Forget
- Read files before editing
- Test with a user that has reflections in the database
- End with git commands
```
