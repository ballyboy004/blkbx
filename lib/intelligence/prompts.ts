// lib/intelligence/prompts.ts
// BLACKBOX intelligence prompts - Enhanced with deep personalization

import type { Profile } from '@/lib/profile/profile'
import { buildBLACKBOXSystemPrompt, addBehavioralHistoryContext } from './framework'
import { routeTask, getTaskTypeInstructions, type TaskRoute } from './routing'
import { formatHistoryForPrompt, type BehavioralHistory } from './history'

/**
 * Builds the system prompt for Complete Dashboard Intelligence
 * 
 * Enhanced with:
 * - Behavioral pattern recognition
 * - Constraint reframing
 * - Progression logic
 * - Personalization requirements
 */
export function buildDashboardIntelligencePrompt(
  profile: Profile,
  formattedHistory?: string,
  history?: BehavioralHistory
): string {
  
  // Route the task based on user state
  const emptyHistory: BehavioralHistory = {
    recentTasks: [],
    taskStats: { completed: 0, skipped: 0, completionRate: 0 },
    recentReflections: [],
    patterns: { completedTypes: [], skippedTypes: [] }
  }
  
  const route = routeTask(profile, history || emptyHistory)
  const routingInstructions = getTaskTypeInstructions(route, history || emptyHistory)
  
  // Add personalization enforcement
  const additionalInstructions = `
${routingInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK GENERATION REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Generate a task that MATCHES the routed type: "${route.type}"
2. Make it specific to THIS artist's:
   - Aesthetic/genre: ${profile.genre_sound || '[not specified]'}
   - Constraints: ${profile.constraints || '[not specified]'}
   - Strengths: ${profile.strengths || '[not specified]'}
   - Behavioral pattern: ${getBehavioralSummary(history || emptyHistory)}

3. Include clear actionable steps with specificity
4. Ground reasoning in their profile data (reference at least 2 specific elements)
5. If they've completed tasks, build on that momentum
6. If they've skipped tasks (${(history || emptyHistory).taskStats.skipped} skipped), avoid those approaches

${getSkipGuidance(history || emptyHistory)}

Generate dashboard intelligence as JSON:`

  const systemPrompt = buildBLACKBOXSystemPrompt('dashboard', profile, additionalInstructions)
  const completionStats = history ? { completed: history.taskStats.completed, skipped: history.taskStats.skipped, completionRate: history.taskStats.completionRate } : undefined
  return addBehavioralHistoryContext(systemPrompt, formattedHistory, completionStats)
}

/**
 * Builds the system prompt for Strategic Task Generation with User Input
 * 
 * Enhanced to serve artist's stated strategic approach while respecting constraints
 */
export function buildStrategicTaskPrompt(
  profile: Profile,
  userStrategicInput: string,
  strategicQuestion?: string
): string {
  
  const contextualInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRATEGIC CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${strategicQuestion ? `Question: "${strategicQuestion}"` : 'Strategic Challenge Identified'}

ARTIST'S STRATEGIC APPROACH:
"${userStrategicInput}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Directly serve their stated strategic approach above
2. Include both creation AND deployment strategy
3. Reference their exact constraints from profile: "${profile.constraints || 'not specified'}"
4. Reference their strengths from profile: "${profile.strengths || 'not specified'}"
5. Match their aesthetic: "${profile.genre_sound || 'not specified'}"
6. Be comprehensive but executable given their time constraints
7. Include concrete timing, platforms, and follow-up actions

PERSONALIZATION CHECK:
- Does this task require knowing their aesthetic to execute properly?
- Does it respect their stated constraints?
- Could another artist with different constraints do this the same way?
  (If yes → make more specific to THIS artist's situation)

Generate aligned strategic task as JSON:`

  return buildBLACKBOXSystemPrompt('strategic-task', profile, contextualInstructions)
}

/**
 * Helper: Get behavioral summary for prompt context
 */
function getBehavioralSummary(history: BehavioralHistory): string {
  if (history.recentTasks.length === 0) {
    return 'No task history yet - new user'
  }
  
  const completed = history.taskStats.completed
  const skipped = history.taskStats.skipped
  const rate = history.taskStats.completionRate
  
  const completedTypes = history.patterns.completedTypes.slice(0, 2).join(', ')
  const skippedTypes = history.patterns.skippedTypes.slice(0, 2).join(', ')
  
  let summary = `${rate}% completion rate (${completed} done, ${skipped} skipped)`
  
  if (completedTypes) {
    summary += ` | Completes: ${completedTypes}`
  }
  
  if (skippedTypes) {
    summary += ` | Skips: ${skippedTypes}`
  }
  
  return summary
}

/**
 * Helper: Get skip-specific guidance based on pattern
 */
function getSkipGuidance(history: BehavioralHistory): string {
  const skipped = history.taskStats.skipped
  const completionRate = history.taskStats.completionRate
  
  if (skipped === 0) {
    return ''
  }
  
  if (skipped === 1) {
    return `\nNOTE: They skipped 1 task. Not a pattern yet - continue with similar approach.`
  }
  
  if (skipped === 2) {
    return `\nWARNING: They skipped 2 tasks. Start adjusting approach - make simpler or try different angle.`
  }
  
  if (skipped >= 3) {
    return `\nCRITICAL: They skipped ${skipped} tasks (${completionRate}% completion). 
Current approaches aren't resonating. Try COMPLETELY different approach:
- If they skip filming → try writing/audio
- If they skip creation → try curation/engagement
- If they skip strategic → try tactical/immediate
Make tasks MUCH simpler and more aligned with demonstrated strengths.`
  }
  
  return ''
}

/**
 * Build prompt for task-only generation (preserves Current Read)
 */
export function buildTaskOnlyPrompt(
  profile: Profile,
  route: { type: string; reason: string },
  history?: BehavioralHistory
): string {
  const formattedHistory = history ? formatHistoryForPrompt(history) : ''

  return `You are BLACKBOX generating ONE task for an independent artist.

ARTIST:
- Genre: ${profile.genre_sound || 'not specified'}
- Stage: ${profile.career_stage || 'building'}
- Goal (90 days): ${profile.primary_goal || 'not specified'}
- Focus (30 days): ${profile.current_focus || 'not specified'}
- Strengths: ${profile.strengths || 'not specified'}
- Weaknesses: ${profile.weaknesses || 'not specified'}
- Constraints: ${profile.constraints || 'not specified'}
- Stuck on: ${profile.stuck_on || 'not specified'}
- Content activity: ${profile.content_activity || 'not specified'}
- Release status: ${profile.release_status || 'not specified'}

TASK TYPE: ${route.type}
WHY THIS TYPE: ${route.reason}

${formattedHistory ? `RECENT BEHAVIOR:\n${formattedHistory}\n` : ''}

Generate a specific, actionable task personalized to THIS artist.
Reference their genre, constraints, or strengths by name.

RULES:
- Every sentence must be complete — no trailing "..." or unfinished thoughts
- If you lack context, be direct: "We need to understand X" not "Understanding what feels off..."
- Be concrete and specific, never vague
- If the artist said "already doing this" — ask WHAT specifically they're doing, don't speculate

Return ONLY valid JSON (no markdown):
{
  "title": "specific action (5-10 words)",
  "reasoning": "why this matters for THIS artist right now (reference their specific situation)",
  "guardrail": "one constraint to keep it focused",
  "guide": {
    "what": "what they're actually doing",
    "how": ["step 1", "step 2", "step 3"],
    "why": "why this approach works for their situation"
  }
}`
}

// Export routing for use elsewhere
export { routeTask, type TaskRoute }
