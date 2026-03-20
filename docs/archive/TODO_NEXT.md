# TODO_NEXT.md
**Last Updated:** 2026-01-25

---

## Current Status

V1 is feature-complete. Focus is now on polish, testing, and preparing for real user feedback.

---

## Next Steps (Ordered)

### Cleanup & Hardening

- [ ] **Remove test routes**
  - Files: `app/api/test-intelligence/route.ts`, `app/api/test-rls/route.ts`
  - Why: Should not be in production

- [ ] **Review unused API routes**
  - Files: `app/api/intelligence/strategic-task/route.ts`, `app/api/intelligence/task-chat/route.ts`
  - Why: Unclear if these are used; remove or document

- [ ] **Clean up legacy task field**
  - File: `app/dashboard/actions/tasks.ts`
  - Why: `task_name` duplicates `title`; pick one

### Testing

- [ ] **Test onboarding flow end-to-end**
  - Files: `app/onboarding/*`
  - Why: Ensure all 5 panels save correctly

- [ ] **Test task complete/skip flow**
  - Files: `components/dashboard/TodayCard.tsx`, `app/dashboard/actions/tasks.ts`
  - Why: Verify reflections save, history updates

- [ ] **Test history dropdown**
  - File: `components/dashboard/TodayCard.tsx`
  - Why: Verify past tasks load with reasoning/guardrail

- [ ] **Test intelligence cache invalidation**
  - Files: `lib/intelligence/cache.ts`, `lib/intelligence/interpret.ts`
  - Why: Ensure new tasks generate when cache expires or profile changes

### User Experience

- [ ] **Add loading states to dashboard sections**
  - File: `app/dashboard/page.tsx`
  - Why: Large AI responses can feel slow without feedback

- [ ] **Add error boundaries**
  - Files: Dashboard components
  - Why: Graceful failure if AI or Supabase errors

- [ ] **Mobile responsiveness check**
  - Files: All dashboard components
  - Why: Ensure usable on phone

### Pre-Launch

- [ ] **Set up custom domain**
  - Where: Cloudflare + Vercel
  - Why: Real URL for testing with users

- [ ] **Create seed user for demo**
  - Where: Supabase
  - Why: Show working product without needing real onboarding

- [ ] **Write user testing script**
  - Where: `docs/USER_TESTING.md`
  - Why: Consistent feedback collection

### Future (Post-V1)

- [ ] Email notifications for new tasks
- [ ] Weekly digest summary
- [ ] Task streaks / patterns visualization
- [ ] Release planning module
- [ ] Reflection capture post-release

---

## Blocked / Needs Decision

- **Name change:** Considering renaming from BLACKBOX to something else (mirror, voie, etc.)
- **Domain:** Waiting on name decision before purchasing
