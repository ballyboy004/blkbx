// lib/intelligence/interpret.ts
// Main interpretation service - REFINED FOR BREVITY
// Expanded: 2026-01-02 - Includes priority task + next actions

import type { Profile } from '@/lib/profile/profile'
import { buildDashboardIntelligencePrompt } from './prompts'
import { generateWithClaude, calculateCost } from './claude'
import { validateCurrentRead } from './validate'

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
  constraint: string
  strategicContext: string[]
  priorityTask: PriorityTask
  nextActions: string[]
}

export type InterpretationResult = {
  intelligence: DashboardIntelligence
  usage: {
    inputTokens: number
    outputTokens: number
  }
  cost: number
  valid: boolean
}

/**
 * Generate complete dashboard intelligence for an artist's profile
 * 
 * Now includes:
 * - Concise interpretations (reduced verbosity)
 * - Intelligent priority task (personalized, not generic)
 * - Next actions (what comes after priority task)
 */
export async function generateDashboardIntelligence(
  profile: Profile,
  options: {
    maxRetries?: number
  } = {}
): Promise<InterpretationResult> {
  const maxRetries = options.maxRetries || 2
  let attempt = 0

  while (attempt < maxRetries) {
    attempt++
    
    console.log(`[Intelligence] Generating dashboard intelligence (attempt ${attempt}/${maxRetries})`, {
      userId: profile.id,
      email: profile.email,
    })

    // Build the system prompt
    const systemPrompt = buildDashboardIntelligencePrompt(profile)

    try {
      // Call Claude API
      const { text, usage } = await generateWithClaude(systemPrompt, {
        maxTokens: 1500, // Increased for task guide
        temperature: 1.0,
      })

      // Parse JSON response
      let intelligence: DashboardIntelligence
      
      try {
        // Clean response (remove markdown code blocks if present)
        const cleanedText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
        intelligence = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error('[Intelligence] JSON parse error:', parseError)
        console.error('[Intelligence] Raw response:', text.substring(0, 500))
        
        if (attempt < maxRetries) {
          console.log('[Intelligence] Retrying due to parse error...')
          continue
        }
        
        throw new Error(`Failed to parse JSON response: ${parseError}`)
      }

      // Validate structure
      if (
        !intelligence.currentRead ||
        !intelligence.identitySummary ||
        !intelligence.edge ||
        !intelligence.friction ||
        !intelligence.constraint ||
        !Array.isArray(intelligence.strategicContext) ||
        !intelligence.priorityTask ||
        !intelligence.priorityTask.title ||
        !intelligence.priorityTask.reasoning ||
        !intelligence.priorityTask.guardrail ||
        !intelligence.priorityTask.guide ||
        !intelligence.priorityTask.guide.what ||
        !Array.isArray(intelligence.priorityTask.guide.how) ||
        !intelligence.priorityTask.guide.why ||
        !Array.isArray(intelligence.nextActions)
      ) {
        console.error('[Intelligence] Invalid structure:', intelligence)
        
        if (attempt < maxRetries) {
          console.log('[Intelligence] Retrying due to invalid structure...')
          continue
        }
        
        throw new Error('Invalid intelligence structure returned')
      }

      // Validate current read quality
      const valid = validateCurrentRead(intelligence.currentRead)

      if (!valid && attempt < maxRetries) {
        console.warn('[Intelligence] Validation failed, retrying...', {
          attempt,
          maxRetries,
          currentReadPreview: intelligence.currentRead.substring(0, 100) + '...',
        })
        continue
      }

      // Calculate cost
      const cost = calculateCost(usage)

      console.log('[Intelligence] Dashboard intelligence generated', {
        valid,
        cost: `$${cost.toFixed(4)}`,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        currentReadLength: intelligence.currentRead.length,
        taskTitle: intelligence.priorityTask.title,
        nextActionsCount: intelligence.nextActions.length,
      })

      return {
        intelligence,
        usage,
        cost,
        valid,
      }
    } catch (error) {
      console.error('[Intelligence] Error generating dashboard intelligence:', error)
      
      // If last attempt, throw
      if (attempt >= maxRetries) {
        throw error
      }
      
      // Otherwise retry
      console.log('[Intelligence] Retrying after error...')
      continue
    }
  }

  // Should never reach here due to throw above, but TypeScript needs this
  throw new Error('Failed to generate dashboard intelligence after max retries')
}

/**
 * DEPRECATED: Old single Current Read generation
 * Kept for backwards compatibility during migration
 */
export async function generateCurrentRead(
  profile: Profile,
  options: {
    maxRetries?: number
  } = {}
): Promise<{
  currentRead: string
  usage: { inputTokens: number; outputTokens: number }
  cost: number
  valid: boolean
}> {
  // Call new function and extract just current read
  const result = await generateDashboardIntelligence(profile, options)
  
  return {
    currentRead: result.intelligence.currentRead,
    usage: result.usage,
    cost: result.cost,
    valid: result.valid,
  }
}

/**
 * Generate task (Phase 2 - not yet implemented)
 * Placeholder for future task generation logic
 */
export async function generateTask(
  profile: Profile,
  currentRead: string
): Promise<{
  title: string
  reasoning: string
  guardrail: string
}> {
  // TODO: Implement task generation
  // For now, return placeholder
  throw new Error('Task generation not yet implemented (Phase 2)')
}
