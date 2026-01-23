// lib/intelligence/prefetch.ts
// Pre-loading system for instant task delivery

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/profile/profile'
import type { PriorityTask, DashboardIntelligence } from './interpret'
import { generateDashboardIntelligence } from './interpret'
import { generateProfileHash } from './cache'

/**
 * Store a prefetched task for a user
 */
export async function storePrefetchedTask(
  userId: string,
  task: PriorityTask,
  fullIntelligence: DashboardIntelligence
): Promise<void> {
  const supabase = await createClient()

  const prefetchData = {
    task,
    currentRead: fullIntelligence.currentRead,
    nextActions: fullIntelligence.nextActions,
    generatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('interpretations')
    .update({ prefetched_task: prefetchData })
    .eq('user_id', userId)

  if (error) {
    console.error('[Prefetch] Error storing prefetched task:', error)
    throw error
  }

  console.log('[Prefetch] Task stored:', task.title)
}

/**
 * Get prefetched task for a user
 */
export async function getPrefetchedTask(
  userId: string
): Promise<{
  task: PriorityTask
  currentRead: string
  nextActions: string[]
  generatedAt: string
} | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('interpretations')
    .select('prefetched_task')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data?.prefetched_task) {
    return null
  }

  // Check if prefetch is fresh (less than 30 minutes old)
  const prefetch = data.prefetched_task as {
    task: PriorityTask
    currentRead: string
    nextActions: string[]
    generatedAt: string
  }

  const ageInMinutes = (Date.now() - new Date(prefetch.generatedAt).getTime()) / (1000 * 60)
  
  if (ageInMinutes > 30) {
    console.log('[Prefetch] Prefetched task too old:', ageInMinutes.toFixed(1), 'minutes')
    return null
  }

  console.log('[Prefetch] Using prefetched task:', prefetch.task.title)
  return prefetch
}

/**
 * Clear prefetched task after use
 */
export async function clearPrefetchedTask(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('interpretations')
    .update({ prefetched_task: null })
    .eq('user_id', userId)

  if (error) {
    console.error('[Prefetch] Error clearing prefetch:', error)
  }
}

/**
 * Generate and store prefetched task in background
 * Called after user views current task
 */
export async function generatePrefetchedTask(
  userId: string,
  profile: Profile
): Promise<void> {
  try {
    console.log('[Prefetch] Generating next task in background...')
    
    const result = await generateDashboardIntelligence(profile, {
      maxRetries: 1, // Only try once for prefetch
      includeBehavioralHistory: true,
    })

    await storePrefetchedTask(userId, result.intelligence.priorityTask, result.intelligence)
    
    console.log('[Prefetch] Task pre-generated:', result.intelligence.priorityTask.title)
  } catch (error) {
    console.error('[Prefetch] Failed to generate:', error)
    // Don't throw - prefetch failure shouldn't break anything
  }
}

/**
 * Check if reflection is substantive enough to modify prefetched task
 */
export function isReflectionSubstantive(reflection: string): boolean {
  if (!reflection) return false
  
  const trimmed = reflection.trim()
  
  // Too short = not substantive
  if (trimmed.length < 20) return false
  
  // Check for actual content words (not just "good" or "done")
  const contentWords = trimmed.toLowerCase().split(/\s+/).filter(word => 
    word.length > 3 && 
    !['good', 'done', 'okay', 'fine', 'nice', 'cool', 'yeah', 'yep', 'the', 'and', 'was', 'this', 'that'].includes(word)
  )
  
  return contentWords.length >= 3
}
