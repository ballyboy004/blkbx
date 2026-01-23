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
  
  const guidance: Record<TaskType, string> = {
    'first-content': `
For a FIRST CONTENT task:
- Keep it simple (phone camera is fine)
- Focus on capturing, not perfecting
- Match their aesthetic from profile
- Single piece of content, not a batch
- Reference their genre/sound explicitly
Example: "Film one 15-second performance clip of your hook - moody lighting matches your dark R&B aesthetic"`,

    'batch-content': `
For BATCH CONTENT creation:
- Suggest 3-5 pieces in one session
- Same setup/location for efficiency
- Match their time constraint explicitly
- Provide hook/angle for each piece
- Reference their aesthetic/genre
Example: "Write 3 posts breaking down your EP's narrative arc - your storytelling strength, not video content"`,

    'optimize-content': `
For OPTIMIZING existing approach:
- Don't suggest "make more" — they post already
- Focus on ONE specific variable to test
- Reference what's NOT working (from stuck_on field)
- Suggest measurable improvement
- Match their aesthetic approach
Example: "Test darker, moodier thumbnails on next 3 videos - lean into your cinematic aesthetic vs trying to be bright/poppy"`,

    'release-planning': `
For RELEASE PLANNING:
- Focus on ONE song or the EP, not everything
- Simple promotional approach (not 50-step plan)
- Match their "depth over hype" if they mention that philosophy
- Don't force daily content machine behavior
- Lean into their stated strengths
Example: "Pick release date 4 weeks out and plan 4 key beats: announcement, liner notes drop, release, follow-up"`,

    'pre-release-content': `
For PRE-RELEASE CONTENT:
- Create teaser content for upcoming release
- Match their aesthetic explicitly
- Don't reveal everything - build mystique
- Lean into their content strength (if they write well → written teasers, if they film well → video)
Example: "Write cryptic track-by-track hints as text posts - your lyricism strength, builds mystery"`,

    'post-release-engagement': `
For POST-RELEASE ENGAGEMENT:
- Engage with responses to release
- Thank fans, respond to comments
- Share reactions/testimonials
- Keep momentum without burning out
Example: "Spend 30 mins responding to comments on your release post - engage depth over breadth"`,

    'edit-content': `
For EDITING task (they just filmed):
- Reference what they just created
- Keep editing simple and aesthetic-matched
- Don't over-produce if aesthetic is raw/lo-fi
- Include time estimate
Example: "Edit your filmed clips: add dark vignette, minimal cuts, layer your track underneath - keep it moody like your sound"`,

    'post-content': `
For POSTING task (they just edited):
- Help them actually publish
- Include caption/timing guidance
- Suggest platform based on their goal
- Reduce posting friction
- Match their voice/aesthetic in suggested caption
Example: "Post your edited clip to TikTok at 7pm with caption: 'late night sessions → [track name] coming soon'"`,

    'engage-audience': `
For ENGAGEMENT task (they just posted):
- Respond to comments on recent post
- Engage with similar creators in their niche
- Be specific about HOW to engage (not just "engage more")
- Match their energy level constraint
Example: "Respond to 5-10 comments on your post, then find 3 artists making cinematic hip-hop and genuinely engage with their work"`,

    'analyze-performance': `
For ANALYSIS task:
- Look at what's working vs not
- Identify ONE insight to act on
- Don't overwhelm with metrics
- Keep it actionable
Example: "Look at your last 5 posts - which hooks stopped scrollers vs got skipped? Test that pattern on next batch"`,

    'reflection-prompt': `
For REFLECTION PROMPT (they've skipped 3+ tasks):
- Generate a question to understand blocking pattern
- Don't assume why they're skipping
- Keep it open-ended and non-judgmental
- Examples:
  * "You've skipped the last few filming tasks - what's making that feel hard right now?"
  * "What kind of tasks feel most doable given your current energy/time?"
  * "What's blocking you from moving forward on [their stated goal]?"
  
CRITICAL: This should be a PROMPT for reflection, not a task. The system needs to pause and understand before generating more tasks they'll skip.`,

    'alternative-approach': `
For ALTERNATIVE APPROACH (they complete some types but skip others):
- Look at what they COMPLETE vs SKIP
- Lean heavily into demonstrated strengths
- Example patterns:
  * Completes writing, skips filming → more writing tasks
  * Completes community tasks, skips creation → more curation/engagement
  * Completes strategic planning, skips execution → break execution into micro-steps
  
Generate a task in their STRENGTH ZONE, not their skip zone.`,

    'strategic-planning': `
For STRATEGIC PLANNING (unclear situation):
- Help them clarify next move
- Focus on their stated goal
- Keep it simple and actionable
- Not a 10-page strategy doc
Example: "Map out your path from 'unreleased EP' to 'fans listening' in 3-4 major beats - keep it simple"`,
  }
  
  return guidance[type] || 'Generate a task appropriate for this routing category.'
}
