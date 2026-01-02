// lib/intelligence/cache.ts
// Caching layer for complete dashboard intelligence
// Design: BLACKBOX_V1_INTELLIGENCE_LAYER_DESIGN.md
// Expanded: 2026-01-02 - Full dashboard intelligence

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/profile/profile'
import type { DashboardIntelligence } from './interpret'
import crypto from 'crypto'

/**
 * Cached interpretation structure (expanded)
 */
export type CachedInterpretation = {
  id: string
  user_id: string
  current_read: string
  identity_summary: string
  edge_interpretation: string
  friction_interpretation: string
  constraint_interpretation: string
  strategic_context: string[] // JSONB in database
  priority_task_title: string
  priority_task_reasoning: string
  priority_task_guardrail: string
  priority_task_guide: {
    what: string
    how: string[]
    why: string
  } // JSONB in database
  next_actions: string[] // JSONB in database
  profile_version_hash: string
  generated_at: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
}

/**
 * Generate MD5 hash of profile data for cache invalidation
 * 
 * Hash includes all onboarding fields that affect interpretation:
 * - context
 * - primary_goal
 * - genre_sound
 * - career_stage
 * - strengths
 * - weaknesses
 * - constraints
 * - current_focus
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
  }

  const dataString = JSON.stringify(relevantFields)
  return crypto.createHash('md5').update(dataString).digest('hex')
}

/**
 * Check if interpretation is stale
 * 
 * Stale if:
 * - Generated >7 days ago
 * - Profile hash has changed
 */
export function isInterpretationStale(
  interpretation: CachedInterpretation,
  currentProfileHash: string
): boolean {
  // Check profile version mismatch
  if (interpretation.profile_version_hash !== currentProfileHash) {
    console.log('[Intelligence] Interpretation stale: profile changed')
    return true
  }

  // Check age (7 days)
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
 * 
 * Returns null if:
 * - No cache exists
 * - Cache is stale (profile changed or >7 days old)
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

  // Check if stale
  const currentHash = generateProfileHash(currentProfile)
  if (isInterpretationStale(cached, currentHash)) {
    return null
  }

  console.log('[Intelligence] Using cached interpretation', {
    generatedAt: cached.generated_at,
    ageInDays: ((Date.now() - new Date(cached.generated_at).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1),
  })

  return cached
}

/**
 * Save complete dashboard intelligence to cache
 * 
 * Upserts on user_id (replaces existing cache)
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
        constraint_interpretation: intelligence.constraint,
        strategic_context: intelligence.strategicContext,
        priority_task_title: intelligence.priorityTask.title,
        priority_task_reasoning: intelligence.priorityTask.reasoning,
        priority_task_guardrail: intelligence.priorityTask.guardrail,
        priority_task_guide: intelligence.priorityTask.guide,
        next_actions: intelligence.nextActions,
        profile_version_hash: profileHash,
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
  // For backwards compatibility during migration
  // This should not be used for new code
  const supabase = await createClient()
  const profileHash = generateProfileHash(profile)

  const { error } = await supabase
    .from('interpretations')
    .upsert(
      {
        user_id: userId,
        current_read: interpretation.currentRead,
        profile_version_hash: profileHash,
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
    // Don't throw - this is optional analytics
  }
}
