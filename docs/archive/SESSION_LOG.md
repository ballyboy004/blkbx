# BLACKBOX — SESSION LOG

**Last Updated:** 2026-01-25
**Current Focus:** V1 Polish + Deployment Stability
**Status:** Live and Functional

---

## Latest Session: 2026-01-25

### Summary
Fixed Vercel deployment issues (webhook broken on old project). Created new Vercel project with fresh connection. Implemented task history dropdown. Created comprehensive engineering handoff document.

### Changes Made

**Deployment:**
- Deleted old Vercel project (webhook was broken)
- Created new Vercel project with fresh GitHub connection
- Renamed local folder from `v0-blackbox-login-page-main` to `blkbx`
- Renamed GitHub repo from `v0-blackbox-login-page` to `blackbox`

**Task History Feature:**
- Added "History" dropdown to TodayCard header
- Compact scrollable list (max-height 192px)
- Click task → modal with reasoning, guardrail, reflection
- Closes on outside click

**Files Modified:**
- `components/dashboard/TodayCard.tsx` — Complete rewrite with history dropdown
- `lib/intelligence/history.ts` — Added reasoning, guardrail to TaskHistoryItem
- `app/dashboard/page.tsx` — Pass full task data to TodayCard

**Documentation:**
- Created `ENGINEERING_HANDOFF.md` — Comprehensive handoff for new coding chats

---

## Previous Session: 2026-01-23

### Intelligence Framework Overhaul

Completely rewrote the intelligence system with deep personalization:

**framework.ts:**
- Detailed voice principles with good/bad examples
- Task quality standards requiring aesthetic in every title
- Mandatory personalization checks
- Constraint reframing logic
- Behavioral learning thresholds (1 skip = note, 2 = adapt, 3+ = hard correct)
- Quality self-check before outputting

**routing.ts:**
- Skip threshold detection (triggers reflection at 3+ skips)
- Skip-aware progression
- New task types: `reflection-prompt`, `alternative-approach`
- Type-specific guidance with aesthetic reminders

**prompts.ts:**
- Behavioral summary helper
- Skip-specific guidance

---

## System State

**V1 Features Complete:**
- Auth + onboarding (5 panels, Claude API follow-ups)
- Dashboard (Current Read, Profile, Patterns, Today cards)
- Intelligence layer (Claude API, 7-day cache)
- Task system (complete/skip with reflections)
- Behavioral learning loop
- Task prefetching (instant delivery)
- History dropdown

**Technical:**
- Local path: `/Users/samuelgilmore/Documents/blkbx`
- GitHub: `ballyboy004/blackbox`
- Deployment: Vercel (new project, auto-deploys working)

**Design System:**
- Dark minimal, frosted glass cards
- IBM Plex Mono typography
- Voice: second-person, grounded, no hype

---

## Next Steps
1. Test history dropdown on live site
2. Consider name change (BLACKBOX → something else)
3. Domain purchase when ready
4. User testing with real artists
