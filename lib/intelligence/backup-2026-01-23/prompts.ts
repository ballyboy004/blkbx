// lib/intelligence/prompts.ts
// BLACKBOX intelligence prompts - simplified with routing

import type { Profile } from '@/lib/profile/profile'
import { buildBLACKBOXSystemPrompt, addBehavioralHistoryContext } from './framework'
import { routeTask, getTaskTypeInstructions, type TaskRoute } from './routing'
import type { BehavioralHistory } from './history'

/**
 * Builds the system prompt for Complete Dashboard Intelligence
 * Uses routing logic to determine task type - AI just fills in specifics
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
  const routingInstructions = getTaskTypeInstructions(route)
  
  const additionalInstructions = `
${routingInstructions}

TASK OUTPUT REQUIREMENTS:
1. Generate a task that MATCHES the routed type above
2. Make it specific to THIS artist's context, constraints, strengths
3. Include clear actionable steps with time estimates
4. Ground reasoning in their profile data only

Generate intelligence as JSON:`

  const systemPrompt = buildBLACKBOXSystemPrompt('dashboard', profile, additionalInstructions)
  return addBehavioralHistoryContext(systemPrompt, formattedHistory)
}

/**
 * Builds the system prompt for Strategic Task Generation with User Input
 */
export function buildStrategicTaskPrompt(
  profile: Profile,
  userStrategicInput: string,
  strategicQuestion?: string
): string {
  
  const contextualInstructions = `
STRATEGIC CONTEXT:
${strategicQuestion ? `Question: "${strategicQuestion}"` : 'Strategic Challenge Identified'}

ARTIST'S APPROACH:
"${userStrategicInput}"

TASK REQUIREMENTS:
1. Directly serve their stated strategic approach
2. Include both creation AND deployment strategy
3. Reference their exact constraints and strengths FROM PROFILE DATA
4. Be comprehensive but executable in focused sessions
5. Include concrete timing, platforms, and follow-up actions

Generate aligned task as JSON:`

  return buildBLACKBOXSystemPrompt('strategic-task', profile, contextualInstructions)
}

// Export routing for use elsewhere
export { routeTask, type TaskRoute }
