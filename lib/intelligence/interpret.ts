// lib/intelligence/interpret.ts
// Main interpretation service with routing-based task generation

import type { Profile } from '@/lib/profile/profile'
import { buildDashboardIntelligencePrompt, buildTaskOnlyPrompt } from './prompts'
import { generateWithClaude, calculateCost } from './claude'
import { validateCurrentRead } from './validate'
import { getBehavioralHistory, formatHistoryForPrompt, type BehavioralHistory } from './history'
import { routeTask } from './routing'

export type TaskGuide = {
  what: string
  how: string[]
  why: string
}

export type PriorityTask = {
  title: string
  reasoning: string
  guardrail: string
  guide: TaskGuide
}

export type DashboardIntelligence = {
  currentRead: string
  identitySummary: string
  edge: string
  friction: string
  strategicContext: string[]
  priorityTask: PriorityTask
  nextActions: string[]
  profileInterpretations: {
    goal: string
    focus: string
    constraints: string
    stage: string
  }
}

export type InterpretationResult = {
  intelligence: DashboardIntelligence
  usage: {
    inputTokens: number
    outputTokens: number
  }
  cost: number
  valid: boolean
  taskRoute?: string // What type of task was routed
}

/**
 * Generate complete dashboard intelligence for an artist's profile
 * 
 * Now uses ROUTING LOGIC:
 * - Code determines what TYPE of task to generate
 * - AI fills in the specifics personalized to the artist
 */
export async function generateDashboardIntelligence(
  profile: Profile,
  options: {
    maxRetries?: number
    includeBehavioralHistory?: boolean
  } = {}
): Promise<InterpretationResult> {
  const maxRetries = options.maxRetries || 2
  const includeBehavioralHistory = options.includeBehavioralHistory !== false
  let attempt = 0

  // Fetch behavioral history for routing + learning
  let history: BehavioralHistory | undefined
  let formattedHistory: string | undefined
  
  if (includeBehavioralHistory && profile.id) {
    try {
      history = await getBehavioralHistory(profile.id)
      if (history.recentTasks.length > 0) {
        formattedHistory = formatHistoryForPrompt(history)
      }
    } catch (error) {
      console.warn('[Intelligence] Failed to fetch behavioral history:', error)
    }
  }

  // Route the task BEFORE generating
  const route = history ? routeTask(profile, history) : routeTask(profile, {
    recentTasks: [],
    taskStats: { completed: 0, skipped: 0, completionRate: 0 },
    recentReflections: [],
    patterns: { completedTypes: [], skippedTypes: [] }
  })

  console.log('[Intelligence] Task routed:', {
    type: route.type,
    reason: route.reason,
    contentActivity: route.context.contentActivity,
    releaseStatus: route.context.releaseStatus,
    lastCompletedTask: route.context.lastCompletedTask
  })

  while (attempt < maxRetries) {
    attempt++
    
    console.log(`[Intelligence] Generating (attempt ${attempt}/${maxRetries})`, {
      userId: profile.id,
      taskType: route.type,
      hasBehavioralHistory: !!formattedHistory
    })

    // Pass both formatted history AND full history object for routing
    const systemPrompt = buildDashboardIntelligencePrompt(profile, formattedHistory, history)

    try {
      const { text, usage } = await generateWithClaude(systemPrompt, {
        maxTokens: 1500,  // Increased from 800 to prevent JSON truncation
        temperature: 0.3,
      })

      let intelligence: DashboardIntelligence
      
      try {
        const cleanedText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
        intelligence = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error('[Intelligence] JSON parse error:', parseError)
        console.error('[Intelligence] Raw response:', text.substring(0, 500))
        
        if (attempt < maxRetries) continue
        throw new Error(`Failed to parse JSON response: ${parseError}`)
      }

      // Validate structure
      if (
        !intelligence.currentRead ||
        !intelligence.identitySummary ||
        !intelligence.edge ||
        !intelligence.friction ||
        !Array.isArray(intelligence.strategicContext) ||
        !intelligence.priorityTask ||
        !intelligence.priorityTask.title ||
        !intelligence.priorityTask.reasoning ||
        !intelligence.priorityTask.guardrail ||
        !intelligence.priorityTask.guide ||
        !intelligence.priorityTask.guide.what ||
        !Array.isArray(intelligence.priorityTask.guide.how) ||
        !intelligence.priorityTask.guide.why ||
        !Array.isArray(intelligence.nextActions) ||
        !intelligence.profileInterpretations ||
        !intelligence.profileInterpretations.goal ||
        !intelligence.profileInterpretations.focus ||
        !intelligence.profileInterpretations.constraints ||
        !intelligence.profileInterpretations.stage
      ) {
        console.error('[Intelligence] Invalid structure:', intelligence)
        if (attempt < maxRetries) continue
        throw new Error('Invalid intelligence structure returned')
      }

      const valid = validateCurrentRead(intelligence.currentRead)

      if (!valid && attempt < maxRetries) {
        console.warn('[Intelligence] Validation failed, retrying...')
        continue
      }

      const cost = calculateCost(usage)

      console.log('[Intelligence] Generated successfully', {
        valid,
        cost: `$${cost.toFixed(4)}`,
        taskType: route.type,
        taskTitle: intelligence.priorityTask.title,
      })

      return {
        intelligence,
        usage,
        cost,
        valid,
        taskRoute: route.type,
      }
    } catch (error) {
      console.error('[Intelligence] Error:', error)
      if (attempt >= maxRetries) throw error
      continue
    }
  }

  throw new Error('Failed to generate dashboard intelligence after max retries')
}

/**
 * Generate ONLY a new task — preserves Current Read
 */
export async function generateTaskOnly(
  profile: Profile,
  history?: BehavioralHistory
): Promise<{ task: PriorityTask; usage: { inputTokens: number; outputTokens: number }; cost: number }> {
  const route = history ? routeTask(profile, history) : routeTask(profile, {
    recentTasks: [],
    taskStats: { completed: 0, skipped: 0, completionRate: 0 },
    recentReflections: [],
    patterns: { completedTypes: [], skippedTypes: [] }
  })

  console.log('[Intelligence] Task-only generation:', route.type)

  const prompt = buildTaskOnlyPrompt(profile, route, history)

  const { text, usage } = await generateWithClaude(prompt, {
    maxTokens: 600,  // Increased from 400 for safety margin
    temperature: 0.3,
  })

  const cleanedText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
  const task = JSON.parse(cleanedText) as PriorityTask

  return {
    task,
    usage,
    cost: calculateCost(usage),
  }
}

/**
 * DEPRECATED: Old single Current Read generation
 */
export async function generateCurrentRead(
  profile: Profile,
  options: { maxRetries?: number } = {}
): Promise<{
  currentRead: string
  usage: { inputTokens: number; outputTokens: number }
  cost: number
  valid: boolean
}> {
  const result = await generateDashboardIntelligence(profile, options)
  
  return {
    currentRead: result.intelligence.currentRead,
    usage: result.usage,
    cost: result.cost,
    valid: result.valid,
  }
}
