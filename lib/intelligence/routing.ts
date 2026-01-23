// lib/intelligence/routing.ts
// Task routing logic - code decides task TYPE, AI fills in specifics
// This replaces complex prompt engineering with explicit routing

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
  }
}

/**
 * Determine what TYPE of task to generate based on user state
 * This is deterministic logic, not AI guessing
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
  
  const context = {
    contentActivity,
    releaseStatus,
    stuckOn,
    lastCompletedTask
  }

  // PRIORITY 1: Task progression (if they just completed something)
  if (lastCompletedTask) {
    const progressionRoute = getProgressionRoute(lastCompletedTask, context)
    if (progressionRoute) return progressionRoute
  }

  // PRIORITY 2: Route based on current activity state
  
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
 * Determine next task based on what they just completed
 */
function getProgressionRoute(
  lastTask: string,
  context: TaskRoute['context']
): TaskRoute | null {
  
  const taskLower = lastTask.toLowerCase()
  
  // Filmed/created content → edit
  if (
    taskLower.includes('film') || 
    taskLower.includes('shoot') || 
    taskLower.includes('record') ||
    taskLower.includes('capture') ||
    (taskLower.includes('create') && taskLower.includes('clip'))
  ) {
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

  // No clear progression match
  return null
}

/**
 * Get prompt instructions for a specific task type
 * This makes prompts simple and focused
 */
export function getTaskTypeInstructions(route: TaskRoute): string {
  
  const { type, reason, context } = route
  
  const baseInstruction = `
TASK ROUTING (determined by system, not AI):
Type: ${type}
Reason: ${reason}
User's content activity: ${context.contentActivity}
User's release status: ${context.releaseStatus}
${context.stuckOn ? `Where they feel stuck: "${context.stuckOn}"` : ''}
${context.lastCompletedTask ? `Last completed task: "${context.lastCompletedTask}"` : 'No previous tasks completed'}

YOUR JOB: Generate a specific task of type "${type}" personalized to this artist.
DO NOT choose a different task type. The routing is already decided.
`

  const typeInstructions: Record<TaskType, string> = {
    'first-content': `
TASK TYPE: First Content Creation
The user has never posted. This is their FIRST content task.
- Make it simple and achievable
- Focus on capturing raw content (phone is fine)
- Don't overwhelm with editing/posting yet
- Just get them to CREATE something`,

    'batch-content': `
TASK TYPE: Batch Content Creation
The user posts inconsistently. Help them batch create.
- Suggest creating 3-5 pieces in one session
- Focus on efficiency (same setup, same location)
- Match their time constraints
- Goal: Have content ready to post over time`,

    'optimize-content': `
TASK TYPE: Optimize Existing Content Approach
The user posts regularly but isn't getting results.
- Don't suggest "make more content"
- Focus on improving hooks, CTAs, timing
- Suggest testing one specific variable
- Goal: Better conversion from existing effort`,

    'release-planning': `
TASK TYPE: Release Planning
The user has unreleased music sitting.
- Focus on getting ONE song ready to release
- Pick a release date
- Create simple promotional timeline
- Goal: Unblock their release paralysis`,

    'pre-release-content': `
TASK TYPE: Pre-Release Content
The user has a release coming.
- Create teaser/promo content for the release
- Build anticipation without revealing everything
- Match their aesthetic and brand
- Goal: Prime audience before release`,

    'post-release-engagement': `
TASK TYPE: Post-Release Engagement
The user just released something.
- Focus on engaging with responses
- Thank fans, respond to comments
- Share user reactions/testimonials
- Goal: Maximize release momentum`,

    'edit-content': `
TASK TYPE: Edit Content
The user just filmed/created raw content.
- Help them edit what they captured
- Keep it simple - don't over-produce
- Match their aesthetic
- Goal: Turn raw content into postable content`,

    'post-content': `
TASK TYPE: Post Content
The user has edited content ready.
- Help them actually post it
- Include caption/hashtag guidance
- Suggest optimal timing
- Goal: Get the content live`,

    'engage-audience': `
TASK TYPE: Engage With Audience
The user just posted content.
- Respond to comments/DMs
- Engage with similar creators
- Don't just "engage" - be specific about how
- Goal: Build relationships from their content`,

    'analyze-performance': `
TASK TYPE: Analyze Performance
The user has been posting and engaging.
- Look at what's working vs not
- Identify one insight to act on
- Don't overwhelm with metrics
- Goal: Learn and adapt approach`,

    'strategic-planning': `
TASK TYPE: Strategic Planning
The user's situation is unclear.
- Help them clarify their next move
- Focus on their stated goal
- Keep it simple and actionable
- Goal: Clear direction for next steps`
  }

  return baseInstruction + (typeInstructions[type] || '')
}
