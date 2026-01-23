// lib/dashboard/intelligence.ts
// Intelligent dashboard service
// Updated: 2026-01-14 - Removed constraint from AI output (use profile.constraints)

import type { Profile } from '@/lib/profile/profile'
import type { DashboardIntelligence, PriorityTask } from '@/lib/intelligence/interpret'
import { getCachedInterpretation, cacheDashboardIntelligence, generateProfileHash } from '@/lib/intelligence/cache'
import { generateDashboardIntelligence } from '@/lib/intelligence/interpret'

export type CompleteDashboardIntelligence = {
  currentRead: string
  identitySummary: string
  edge: string
  friction: string
  strategicContext: string[]
  priorityTask: PriorityTask
  nextActions: string[]
  source: 'cache' | 'generated' | 'fallback'
  metadata?: {
    generatedAt?: string
    cost?: string
  }
}

/**
 * Get complete intelligent dashboard for user
 * 
 * Includes:
 * - Concise interpretations
 * - Intelligent priority task (personalized)
 * - Next actions
 */
export async function getCompleteDashboardIntelligence(
  userId: string,
  profile: Profile
): Promise<CompleteDashboardIntelligence> {
  try {
    // Try cache first
    const cached = await getCachedInterpretation(userId, profile)
    
    if (cached && cached.identity_summary && cached.priority_task_title) {
      console.log('[Dashboard Intelligence] Using complete cached interpretation')
      return {
        currentRead: cached.current_read,
        identitySummary: cached.identity_summary,
        edge: cached.edge_interpretation,
        friction: cached.friction_interpretation,
        strategicContext: cached.strategic_context,
        priorityTask: {
          title: cached.priority_task_title,
          reasoning: cached.priority_task_reasoning,
          guardrail: cached.priority_task_guardrail,
          guide: cached.priority_task_guide,
        },
        nextActions: cached.next_actions,
        source: 'cache',
        metadata: {
          generatedAt: cached.generated_at,
          cost: `$${cached.cost_usd}`,
        },
      }
    }

    // Cache miss - generate new
    console.log('[Dashboard Intelligence] Generating complete dashboard intelligence')
    const result = await generateDashboardIntelligence(profile)

    // Cache the result
    await cacheDashboardIntelligence(
      userId,
      profile,
      result.intelligence,
      result.usage,
      result.cost
    )

    return {
      ...result.intelligence,
      source: 'generated',
      metadata: {
        cost: `$${result.cost.toFixed(4)}`,
      },
    }
  } catch (error) {
    console.error('[Dashboard Intelligence] Error getting complete intelligence:', error)
    
    return buildFallbackIntelligence(profile)
  }
}

/**
 * Fallback dashboard intelligence if API fails
 */
function buildFallbackIntelligence(profile: Profile): CompleteDashboardIntelligence {
  const stage = profile.career_stage || 'building'
  const goal = profile.primary_goal || 'growing your career'
  const focus = profile.current_focus || 'next steps'

  return {
    currentRead: `You're at the ${stage} stage, focused on ${goal}. BLACKBOX is still learning your patterns - check back soon for deeper strategic insights.`,
    identitySummary: profile.context 
      ? profile.context.split('.')[0] + '.' 
      : 'Independent artist building their career.',
    edge: profile.strengths || 'Creative consistency',
    friction: profile.weaknesses || 'Resource constraints',
    strategicContext: [
      `Career stage: ${stage}`,
      `Primary goal: ${goal}`,
    ],
    priorityTask: {
      title: focus,
      reasoning: 'Based on your current focus. BLACKBOX will provide more intelligent task generation soon.',
      guardrail: 'Work within your constraints.',
      guide: {
        what: 'Working on your current focus.',
        how: ['Complete this task', 'Check back for next steps'],
        why: 'BLACKBOX is still learning your patterns.',
      },
    },
    nextActions: [
      'Complete priority task',
      'Check back for next steps',
    ],
    source: 'fallback',
  }
}
