// lib/intelligence/cache.ts
// Caching layer for complete dashboard intelligence
// Updated: 2026-01-21 - Added prompt version for cache invalidation on prompt changes

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/profile/profile'
import type { DashboardIntelligence } from './interpret'
import crypto from 'crypto'

// IMPORTANT: Increment this when prompts change significantly
// This forces cache invalidation for all users
const PROMPT_VERSION = 5

/**
 * Cached interpretation structure
 */
export type CachedInterpretation = {
  id: string
  user_id: string
  current_read: string
  identity_summary: string
  edge_interpretation: string
  friction_interpretation: string
  constraint_interpretation?: string // Legacy field, may not be used
  strategic_context: string[]
  priority_task_title: string
  priority_task_reasoning: string
  priority_task_guardrail: string
  priority_task_guide: {
    what: string
    how: string[]
    why: string
  }
  next_actions: string[]
  profile_version_hash: string
  generated_at: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  // Strategic input fields
  strategic_input_used?: string
  strategic_question_used?: string
  // Prompt version for invalidation
  prompt_version?: number
}

/**
 * Generate MD5 hash of profile data for cache invalidation
 */
export function generateProfileHash(profile: Profile): string {
  const relevantFields = {
    context: profile.context || '',
    primary_goal: profile.primary_goal || '',
    genre_sound: profile.genre_sound || '',
    career_stage: profile.career_stage || '',
    strengths: profile.strengths || '',
    weaknesses: profile.weaknesses || '',
    constraints: profile.constraints || '',
    current_focus: profile.current_focus || '',
    current_state: profile.current_state || '',
    // NEW fields for routing
    content_activity: profile.content_activity || '',
    release_status: profile.release_status || '',
    stuck_on: profile.stuck_on || '',
  }

  const dataString = JSON.stringify(relevantFields)
  return crypto.createHash('md5').update(dataString).digest('hex')
}

/**
 * Check if interpretation is stale
 */
export function isInterpretationStale(
  interpretation: CachedInterpretation,
  currentProfileHash: string
): boolean {
  // Check prompt version - invalidate if prompts were updated
  if (!interpretation.prompt_version || interpretation.prompt_version < PROMPT_VERSION) {
    console.log('[Intelligence] Interpretation stale: prompt version outdated', {
      cached: interpretation.prompt_version || 'none',
      current: PROMPT_VERSION
    })
    return true
  }

  if (interpretation.profile_version_hash !== currentProfileHash) {
    console.log('[Intelligence] Interpretation stale: profile changed')
    return true
  }

  const generatedAt = new Date(interpretation.generated_at)
  const now = new Date()
  const ageInDays = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24)

  if (ageInDays > 7) {
    console.log(`[Intelligence] Interpretation stale: ${ageInDays.toFixed(1)} days old`)
    return true
  }

  return false
}

/**
 * Get cached interpretation for a user
 */
export async function getCachedInterpretation(
  userId: string,
  currentProfile: Profile
): Promise<CachedInterpretation | null> {
  console.log('[Intelligence Cache] Checking cache for user:', userId)
  
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('interpretations')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[Intelligence] Error fetching cached interpretation:', error)
    return null
  }

  if (!data) {
    console.log('[Intelligence] No cached interpretation found')
    return null
  }

  const cached = data as CachedInterpretation

  const currentHash = generateProfileHash(currentProfile)
  if (isInterpretationStale(cached, currentHash)) {
    return null
  }

  console.log('[Intelligence] Using cached interpretation', {
    generatedAt: cached.generated_at,
    ageInDays: ((Date.now() - new Date(cached.generated_at).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1),
    promptVersion: cached.prompt_version,
  })

  return cached
}

/**
 * Save complete dashboard intelligence to cache
 */
export async function cacheDashboardIntelligence(
  userId: string,
  profile: Profile,
  intelligence: DashboardIntelligence,
  usage: {
    inputTokens: number
    outputTokens: number
  },
  cost: number
): Promise<void> {
  const supabase = await createClient()

  const profileHash = generateProfileHash(profile)

  const { error } = await supabase
    .from('interpretations')
    .upsert(
      {
        user_id: userId,
        current_read: intelligence.currentRead,
        identity_summary: intelligence.identitySummary,
        edge_interpretation: intelligence.edge,
        friction_interpretation: intelligence.friction,
        constraint_interpretation: '', // Legacy field - constraints come from profile now
        strategic_context: intelligence.strategicContext,
        priority_task_title: intelligence.priorityTask.title,
        priority_task_reasoning: intelligence.priorityTask.reasoning,
        priority_task_guardrail: intelligence.priorityTask.guardrail,
        priority_task_guide: intelligence.priorityTask.guide,
        next_actions: intelligence.nextActions,
        profile_version_hash: profileHash,
        prompt_version: PROMPT_VERSION,
        generated_at: new Date().toISOString(),
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        cost_usd: cost,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('[Intelligence] Error caching interpretation:', error)
    throw error
  }

  console.log('[Intelligence] Dashboard intelligence cached successfully', {
    userId,
    profileHash,
    promptVersion: PROMPT_VERSION,
    cost: `$${cost.toFixed(4)}`,
  })
}

/**
 * DEPRECATED: Old cache function for backwards compatibility
 */
export async function cacheInterpretation(
  userId: string,
  profile: Profile,
  interpretation: {
    currentRead: string
    usage: {
      inputTokens: number
      outputTokens: number
    }
    cost: number
  }
): Promise<void> {
  const supabase = await createClient()
  const profileHash = generateProfileHash(profile)

  const { error } = await supabase
    .from('interpretations')
    .upsert(
      {
        user_id: userId,
        current_read: interpretation.currentRead,
        profile_version_hash: profileHash,
        prompt_version: PROMPT_VERSION,
        generated_at: new Date().toISOString(),
        input_tokens: interpretation.usage.inputTokens,
        output_tokens: interpretation.usage.outputTokens,
        cost_usd: interpretation.cost,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('[Intelligence] Error caching interpretation:', error)
    throw error
  }
}

/**
 * Log cost to intelligence_costs table (optional analytics)
 */
export async function logCost(
  userId: string,
  operation: string,
  usage: {
    inputTokens: number
    outputTokens: number
  },
  cost: number
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('intelligence_costs')
    .insert({
      user_id: userId,
      operation,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cost_usd: cost,
      timestamp: new Date().toISOString(),
    })

  if (error) {
    console.error('[Intelligence] Error logging cost:', error)
  }
}
