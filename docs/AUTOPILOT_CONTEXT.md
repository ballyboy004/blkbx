# AUTOPILOT_CONTEXT.md
**Last Updated:** 2026-03-05
**Purpose:** Explains the autonomous build pipeline we set up so Claude understands the current engineering workflow for BLACKBOX.

---

## What We Built

We set up a fully autonomous build pipeline that allows BLACKBOX to be developed in the background — without Samuel needing to sit in Cursor or write code manually. The system runs while he focuses on the HVAC automation business.

The pipeline has three components:
1. **AUTOPILOT_BLUEPRINT.md** — a staged build queue living in the repo
2. **Make.com scenario** — reads the blueprint, calls Claude API, pushes tasks to GitHub
3. **Cursor Automation** — watches the GitHub repo, executes tasks, opens PRs

---

## Why We Built It This Way

Samuel is running two parallel tracks: HVAC automation consulting (immediate income) and BLACKBOX (long-term platform). He can't spend hours daily in Cursor on BLACKBOX while also doing sales calls and building the consulting business.

The goal was to make BLACKBOX development as close to zero-daily-effort as possible — queue up work once, fire a webhook, review a PR at night. The context lives in files, not in chat history, so nothing is lost between sessions.

We chose this architecture specifically because:
- Samuel already had Make.com skills and could build the scenario himself
- Cursor Automations runs agents in isolated cloud VMs — no local machine needed
- The blueprint format ensures Cursor gets precise, scoped tasks with no ambiguity
- All constraints (design system, don't-touch files, voice) are baked into the system prompt so they apply to every task automatically

---

## Repository Structure

**Main repo:** `ballyboy004/blackbox` (production, `/Users/samuelgilmore/Documents/blkbox`)
**Autopilot repo:** `ballyboy004/blackbox-autopilot` (sandbox, `/Users/samuelgilmore/Documents/blkbox-autopilot`)

The autopilot repo is a full copy of the main repo. Cursor builds in the autopilot repo on a branch called `autopilot-queue`. Samuel reviews PRs and cherry-picks good work into the main repo. The two repos are completely independent — nothing in the autopilot repo can break production.

---

## How the Pipeline Works (Step by Step)

### 1. Samuel adds a stage to AUTOPILOT_BLUEPRINT.md
File location: `docs/AUTOPILOT_BLUEPRINT.md` in both repos.

Each stage follows this exact format:
```
### STAGE X.X — [Name]
**Status:** `not-started`
**Depends on:** [previous stage or nothing]
**Files to read first:** [list]
**Files to NOT touch:** [list]
**What to do:** [precise description]
**Done when:** [acceptance criteria]
**Notes:** [any edge cases]
```

Status values: `not-started` | `queued` | `in-progress` | `done` | `skipped`

### 2. Samuel fires the Make.com webhook
The webhook URL is bookmarked on his phone. One tap. That's the only manual step.

### 3. Make.com scenario runs (6 modules)
- **Module 1:** Custom webhook (trigger)
- **Module 3:** Set Variable — blueprint text hardcoded as a variable
- **Module 4:** Text Parser — regex extracts the first `not-started` stage block
- **Module 6:** HTTP POST to Anthropic API — Claude converts the stage spec into a precise Cursor prompt
- **Module 7:** Set Variable — extracts Claude's response text
- **Module 8:** HTTP PUT to GitHub API — pushes the Cursor prompt as `docs/CURRENT_TASK.md` to the `autopilot-queue` branch

### 4. Cursor Automation triggers
Cursor watches `ballyboy004/blackbox-autopilot` on the `autopilot-queue` branch. When a new push lands, it wakes up, reads `docs/CURRENT_TASK.md`, and executes the task.

### 5. Cursor builds the task and opens a PR
The agent reads all specified files, makes surgical changes, and opens a PR against `blackbox-autopilot/main`. Samuel gets notified.

### 6. Samuel reviews the PR
Takes 5-10 minutes. Merge what's good. If it's wrong, close the PR and move on — the autopilot repo is a sandbox, nothing is at risk.

### 7. Cherry-pick into main
If the PR is solid, Samuel manually applies the changes to the main `blackbox` repo.

---

## Key Files

| File | Location | Purpose |
|------|----------|---------|
| `AUTOPILOT_BLUEPRINT.md` | `docs/` in both repos | Master build queue — staged tasks in order |
| `AUTOPILOT_PROMPT.md` | `docs/` in both repos | System prompt used in the Claude API call |
| `CURRENT_TASK.md` | `docs/` in autopilot repo only | The active task Cursor is executing (auto-generated) |

---

## Current Build Queue

13 stages across 5 phases. All currently `not-started`.

**Phase 1 — Cleanup & Hardening:** Remove test routes, audit unused API routes, clean up legacy task_name field.

**Phase 2 — UX Polish:** Loading states, error boundaries, mobile responsiveness.

**Phase 3 — Pre-Launch:** Seed user documentation, user testing script.

**Phase 4 — Intelligence Expansion:** Weekly digest, streak tracking, release module scaffolding.

**Phase 5 — Growth Features:** Email notifications, post-release reflections.

Full detail in `docs/AUTOPILOT_BLUEPRINT.md`.

---

## Daily Workflow

**When Samuel has new ideas or tasks:**
Open `AUTOPILOT_BLUEPRINT.md`, add a new stage at the bottom in the correct format, push to repo. Done.

**Each morning (optional):**
Fire the webhook URL from phone. Takes 3 seconds.

**Each evening:**
Check `github.com/ballyboy004/blackbox-autopilot/pulls` for completed PRs. Review and merge what's good.

**For one-off urgent tasks:**
Edit `docs/CURRENT_TASK.md` directly in the `autopilot-queue` branch on GitHub. Cursor triggers immediately. No Make.com needed.

---

## Important Constraints (Always Apply)

These are baked into the Cursor Automation instructions and the Claude API system prompt. They apply to every task automatically:

- NEVER modify `/lib/intelligence/framework.ts` — heavily tuned, treat as locked
- NEVER modify Supabase RLS policies
- NEVER change card styling or the design system
- NEVER add npm dependencies without flagging it
- NEVER refactor working code
- NEVER rewrite entire files — surgical edits only
- Always read target files before making changes
- Always match existing code style and naming conventions
- Design system: IBM Plex Mono only, zinc palette only, no emojis
- Voice: direct, observational, second-person, no hype

---

## Known Issues / Maintenance Notes

**SHA issue on repeat runs:** GitHub's API requires the existing file's `sha` when updating a file that already exists. Currently, `CURRENT_TASK.md` must be manually deleted from the `autopilot-queue` branch on GitHub before each run, or the Make.com Module 8 will fail. Fix: add a GET request before the PUT to fetch the current sha and include it in the body. Not yet implemented.

**Blueprint must be kept in sync:** When Samuel updates `AUTOPILOT_BLUEPRINT.md` in the main repo, he should also update the hardcoded blueprint text in Make.com Module 3. They should stay identical.

**Stage statuses:** After reviewing a PR, manually update the stage status in `AUTOPILOT_BLUEPRINT.md` from `not-started` to `done`. The Cursor agent is instructed to do this automatically but may not always succeed.

---

## What This Means for Claude (This Chat)

When Samuel asks about BLACKBOX engineering work, assume this pipeline is the execution layer. Claude's role in this chat is:

1. **Product thinking** — what should be built, in what order, why
2. **Stage authoring** — help write new stages for `AUTOPILOT_BLUEPRINT.md` in the correct format
3. **PR review support** — if Samuel shares a PR diff, help evaluate whether the changes are correct
4. **Architecture decisions** — anything that requires reasoning before coding

Claude does NOT need to write code for Samuel to paste into Cursor manually anymore. That workflow is replaced by the pipeline. Instead, Claude writes stages for the blueprint, and the pipeline handles execution.
