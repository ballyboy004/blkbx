// lib/intelligence/routing.ts
// Task routing logic - Enhanced with skip threshold detection and progression validation
// Philosophy: Code decides task TYPE, AI fills in specifics personalized to the artist

import type { Profile } from '@/lib/profile/profile'
import type { BehavioralHistory } from './history'

export type TaskType = 
  // Content creation flow
  | 'first-content'           // Never posted → create first content
  | 'batch-content'           // Posts sometimes → batch create
  | 'optimize-content'        // Posts regularly but low conversion → optimize
  
  // Release flow
  | 'release-planning'        // Has unreleased music → plan release
  | 'pre-release-content'     // Has release coming → create promo content
  | 'post-release-engagement' // Just released → engage and analyze
  
  // Progression flow (based on last completed task)
  | 'edit-content'            // Just filmed → edit
  | 'post-content'            // Just edited → post
  | 'engage-audience'         // Just posted → engage
  | 'analyze-performance'     // Has been posting → analyze
  
  // Adaptation flow (when skipping patterns emerge)
  | 'reflection-prompt'       // Skipped 3+ tasks → ask why
  | 'alternative-approach'    // Pattern shows strength elsewhere → lean into it
  
  // Default
  | 'strategic-planning'      // Unclear situation → planning task

export type TaskRoute = {
  type: TaskType
  reason: string
  context: {
    contentActivity: string
    releaseStatus: string
    stuckOn: string | null
    lastCompletedTask: string | null
    skipPattern: {
      count: number
      types: string[]
      shouldAdapt: boolean
    }
  }
}

/**
 * Determine what TYPE of task to generate based on user state
 * Enhanced with skip threshold detection and behavioral pattern recognition
 */
export function routeTask(
  profile: Profile,
  history: BehavioralHistory
): TaskRoute {
  
  const contentActivity = profile.content_activity || 'sometimes'
  const releaseStatus = profile.release_status || 'few'
  const stuckOn = profile.stuck_on || null
  
  // Get last completed task
  const lastCompleted = history.recentTasks.find(t => t.status === 'done')
  const lastCompletedTask = lastCompleted?.title || null
  
  // Analyze skip pattern
  const skipPattern = analyzeSkipPattern(history)
  
  const context = {
    contentActivity,
    releaseStatus,
    stuckOn,
    lastCompletedTask,
    skipPattern
  }

  // PRIORITY 0: Handle high skip rate (3+ skips or <40% completion rate)
  if (skipPattern.shouldAdapt && history.taskStats.skipped >= 3) {
    return {
      type: 'reflection-prompt',
      reason: `User has skipped ${history.taskStats.skipped} tasks (${history.taskStats.completionRate}% completion). Need to understand what's blocking them.`,
      context
    }
  }

  // PRIORITY 1: Task progression (if they just completed something)
  if (lastCompletedTask) {
    const progressionRoute = getProgressionRoute(lastCompletedTask, context, history)
    if (progressionRoute) return progressionRoute
  }

  // PRIORITY 2: Adapt to behavioral patterns
  if (skipPattern.shouldAdapt && history.patterns.completedTypes.length > 0) {
    // They complete some types but skip others - lean into what works
    return {
      type: 'alternative-approach',
      reason: `User completes ${history.patterns.completedTypes[0]} tasks but skips others. Lean into their demonstrated strength.`,
      context
    }
  }

  // PRIORITY 3: Route based on current activity state
  
  // Never posts → first content creation
  if (contentActivity === 'never') {
    return {
      type: 'first-content',
      reason: 'User has never posted - start with first content creation',
      context
    }
  }

  // Has unreleased music → focus on release
  if (releaseStatus === 'unreleased') {
    return {
      type: 'release-planning',
      reason: 'User has unreleased music sitting - help them release',
      context
    }
  }

  // Posts regularly but feels stuck on conversion → optimize
  if (contentActivity === 'regular' && stuckOn?.toLowerCase().includes('engag')) {
    return {
      type: 'optimize-content',
      reason: 'User posts regularly but struggles with engagement - optimize approach',
      context
    }
  }

  // Posts sometimes → batch content
  if (contentActivity === 'sometimes' || contentActivity === 'rarely') {
    return {
      type: 'batch-content',
      reason: 'User posts inconsistently - help them batch create',
      context
    }
  }

  // Working on first release → pre-release content
  if (releaseStatus === 'first') {
    return {
      type: 'pre-release-content',
      reason: 'User working on first release - create promotional content',
      context
    }
  }

  // Default: strategic planning
  return {
    type: 'strategic-planning',
    reason: 'Unclear situation - generate strategic planning task',
    context
  }
}

/**
 * Analyze skip pattern to detect behavioral issues
 * Returns skip count, types, and whether we should adapt approach
 */
function analyzeSkipPattern(history: BehavioralHistory): {
  count: number
  types: string[]
  shouldAdapt: boolean
} {
  const skipped = history.taskStats.skipped
  const completionRate = history.taskStats.completionRate
  const skippedTypes = history.patterns.skippedTypes
  
  // Should adapt if:
  // - 3+ tasks skipped, OR
  // - Completion rate < 40% and at least 5 tasks attempted
  const totalTasks = history.taskStats.completed + history.taskStats.skipped
  const shouldAdapt = skipped >= 3 || (completionRate < 40 && totalTasks >= 5)
  
  return {
    count: skipped,
    types: skippedTypes,
    shouldAdapt
  }
}

/**
 * Determine next task based on what they just completed
 * Enhanced with skip awareness
 */
function getProgressionRoute(
  lastTask: string,
  context: TaskRoute['context'],
  history: BehavioralHistory
): TaskRoute | null {
  
  const taskLower = lastTask.toLowerCase()
  
  // Check if next logical step has been skipped before
  // If so, try alternative route
  
  // Filmed/created content → edit (or post if they skip editing)
  if (
    taskLower.includes('film') || 
    taskLower.includes('shoot') || 
    taskLower.includes('record') ||
    taskLower.includes('capture') ||
    (taskLower.includes('create') && (taskLower.includes('clip') || taskLower.includes('video')))
  ) {
    // Check if they skip editing tasks
    const skipsEditing = context.skipPattern.types.some(t => 
      t.toLowerCase().includes('edit')
    )
    
    if (skipsEditing) {
      return {
        type: 'post-content',
        reason: `User filmed content but has skipped editing tasks before. Try posting raw footage instead.`,
        context
      }
    }
    
    return {
      type: 'edit-content',
      reason: `User just completed "${lastTask}" - next step is editing`,
      context
    }
  }

  // Edited content → post
  if (
    taskLower.includes('edit') || 
    taskLower.includes('cut') ||
    taskLower.includes('add caption') ||
    taskLower.includes('add text')
  ) {
    return {
      type: 'post-content',
      reason: `User just completed "${lastTask}" - next step is posting`,
      context
    }
  }

  // Posted content → engage
  if (
    taskLower.includes('post') || 
    taskLower.includes('publish') ||
    taskLower.includes('upload') ||
    taskLower.includes('share')
  ) {
    return {
      type: 'engage-audience',
      reason: `User just completed "${lastTask}" - next step is engagement`,
      context
    }
  }

  // Engaged → analyze (or start new batch)
  if (
    taskLower.includes('engage') || 
    taskLower.includes('respond') ||
    taskLower.includes('reply') ||
    taskLower.includes('comment')
  ) {
    return {
      type: 'analyze-performance',
      reason: `User just completed "${lastTask}" - next step is analysis`,
      context
    }
  }

  // Planned/strategized → create
  if (
    taskLower.includes('plan') || 
    taskLower.includes('framework') ||
    taskLower.includes('strategy') ||
    taskLower.includes('concept') ||
    taskLower.includes('brainstorm')
  ) {
    return {
      type: 'first-content',
      reason: `User just completed "${lastTask}" - next step is creating what they planned`,
      context
    }
  }

  // Wrote content (announcement, liner notes, etc) → more writing
  if (
    taskLower.includes('write') ||
    taskLower.includes('wrote') ||
    taskLower.includes('liner notes') ||
    taskLower.includes('announcement')
  ) {
    return {
      type: 'batch-content',
      reason: `User completed writing task "${lastTask}" - build on that writing momentum`,
      context
    }
  }

  // No clear progression match
  return null
}

/**
 * Get prompt instructions for a specific task type
 * Enhanced with collaborative framing (not prescriptive)
 */
export function getTaskTypeInstructions(
  route: TaskRoute,
  history: BehavioralHistory
): string {
  
  const { type, reason, context } = route
  
  const baseContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK ROUTING CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strategic Assessment: ${reason}

Current State:
- Content activity: ${context.contentActivity}
- Release status: ${context.releaseStatus}
${context.stuckOn ? `- Where they feel stuck: "${context.stuckOn}"` : ''}
${context.lastCompletedTask ? `- Last completed: "${context.lastCompletedTask}"` : '- No completed tasks yet'}
${context.skipPattern.count > 0 ? `- Skip pattern: ${context.skipPattern.count} skipped (${context.skipPattern.types.slice(0, 2).join(', ')})` : ''}

Recommended Task Category: ${type}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Given this routing recommendation, generate a ${type} task that:
1. Serves their PRIMARY GOAL from profile
2. Respects their CONSTRAINTS
3. Builds on their STRENGTHS
4. Is specific to THEIR aesthetic/situation (not generic)
${context.lastCompletedTask ? '5. Builds directly on their last completed task' : ''}
${context.skipPattern.count >= 2 ? '6. AVOIDS approaches they consistently skip' : ''}
`

  const typeGuidance = getTypeSpecificGuidance(type, history)
  
  return baseContext + '\n' + typeGuidance
}

function getTypeSpecificGuidance(type: TaskType, history: BehavioralHistory): string {
  
  const aestheticReminder = `
⚠️  CRITICAL: EVERY task must mention their aesthetic/genre BY NAME in BOTH title/what AND reasoning.
    Do NOT use generic "your style" or "your sound" - use their EXACT aesthetic terms from profile.
`
  
  const guidance: Record<TaskType, string> = {
    'first-content': `${aestheticReminder}
For a FIRST CONTENT task:
- Keep it simple (phone camera is fine)
- MANDATORY: Reference their specific aesthetic/genre BY NAME
- Single piece of content, not a batch
- Match their vibe (if dark R&B → moody/shadowy, if lo-fi → chill/raw)
Example: "Film one moody clip of you layering beats - shadowy Weeknd-influenced vibe matching your dark R&B sound"`,

    'batch-content': `${aestheticReminder}
For BATCH CONTENT creation:
- Suggest 3-5 pieces in one session
- MANDATORY: Every piece matches their aesthetic/genre explicitly
- Same setup/location for efficiency
- Match their time constraint explicitly
Example: "Create 3 atmospheric behind-the-scenes clips of your experimental/ambient production process"`,

    'optimize-content': `${aestheticReminder}
For OPTIMIZING existing approach:
- Don't suggest "make more" — they post already
- Focus on ONE aesthetic-specific variable to test
- Reference their exact aesthetic from profile
Example: "Test moodier, darker thumbnails on next 3 videos - double down on your dark R&B aesthetic vs trying to be bright"`,

    'release-planning': `${aestheticReminder}
For RELEASE PLANNING:
- Focus on ONE song or EP that matches their aesthetic
- MANDATORY: Reference their aesthetic/genre in the plan
- Simple promotional approach matching their vibe
Example: "Plan 4 moody teaser moments for your dark R&B release - atmospheric snippets, not bright poppy content"`,

    'pre-release-content': `${aestheticReminder}
For PRE-RELEASE CONTENT:
- Create teaser content matching their aesthetic explicitly by name
- Build mystique that fits their vibe (dark → shadowy, experimental → abstract)
- MANDATORY: Reference their aesthetic/genre in title and reasoning
Example: "Film 3 shadowy teaser clips for your dark R&B release - moody Weeknd-influenced atmosphere"`,

    'post-release-engagement': `${aestheticReminder}
For POST-RELEASE ENGAGEMENT:
- Engage with fans who resonate with their specific aesthetic
- Reference their sound when responding
Example: "Thank fans who specifically mentioned your moody/dark R&B vibe - your aesthetic people"`,

    'edit-content': `${aestheticReminder}
For EDITING task (they just filmed):
- Editing style must match their aesthetic (dark R&B → moody grading, lo-fi → raw)
- Reference their aesthetic by name
Example: "Edit clips with dark vignette and grain - match your experimental/ambient aesthetic"`,

    'post-content': `${aestheticReminder}
For POSTING task (they just edited):
- Timing and platform should match their vibe
- Caption reflects their aesthetic language
Example: "Post your moody clip at night - matches your dark R&B timing and atmosphere"`,

    'engage-audience': `${aestheticReminder}
For ENGAGEMENT task (they just posted):
- Find creators in their aesthetic lane specifically
- Engage with fans who GET their vibe
Example: "Find 3 dark R&B/experimental producers - your aesthetic peers, not random creators"`,

    'analyze-performance': `${aestheticReminder}
For ANALYSIS task:
- Analyze what aesthetic-specific content works
- Identify patterns in their vibe
Example: "Check which clips resonated - likely your moodier dark R&B content vs anything bright"`,

    'reflection-prompt': `
For REFLECTION PROMPT (they've skipped 3+ tasks):
- Ask what's blocking them
- Keep open-ended and non-judgmental
Example: "You've skipped filming tasks - what's making visual content feel hard?"
  
CRITICAL: This is a reflection PROMPT, not a task.`,

    'alternative-approach': `${aestheticReminder}
For ALTERNATIVE APPROACH (strength pattern detected):
- Lean into what they COMPLETE with aesthetic specificity
- Match strength to their aesthetic
Example: "You complete writing - write 3 atmospheric descriptions of your dark R&B tracks"`,

    'strategic-planning': `${aestheticReminder}
For STRATEGIC PLANNING:
- Clarify their path for their SPECIFIC aesthetic
- Not generic strategy
Example: "Map out how to position your dark R&B/experimental sound in 3-4 moves"`,
  }
  
  return guidance[type] || 'Generate a task appropriate for this routing category.'
}
