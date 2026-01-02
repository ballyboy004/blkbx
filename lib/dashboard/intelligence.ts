// lib/dashboard/intelligence.ts
// Intelligent dashboard service - REFINED VERSION
// Now includes: task generation + next actions

import type { Profile } from '@/lib/profile/profile'
import type { DashboardIntelligence, PriorityTask } from '@/lib/intelligence/interpret'
import { getCachedInterpretation, cacheDashboardIntelligence, generateProfileHash } from '@/lib/intelligence/cache'
import { generateDashboardIntelligence } from '@/lib/intelligence/interpret'

export type CompleteDashboardIntelligence = {
  currentRead: string
  identitySummary: string
  edge: string
  friction: string
  constraint: string
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
 * Now includes:
 * - Concise interpretations (reduced verbosity)
 * - Intelligent priority task (personalized, not generic)
 * - Next actions (what comes after priority task)
 */
export async function getCompleteDashboardIntelligence(
  userId: string,
  profile: Profile
): Promise<CompleteDashboardIntelligence> {
  try {
    // Try cache first
    const cached = await getCachedInterpretation(userId, profile)
    
    if (cached && cached.identity_summary && cached.priority_task_title) {
      // Valid complete cache exists (with task)
      console.log('[Dashboard Intelligence] Using complete cached interpretation')
      return {
        currentRead: cached.current_read,
        identitySummary: cached.identity_summary,
        edge: cached.edge_interpretation,
        friction: cached.friction_interpretation,
        constraint: cached.constraint_interpretation,
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

    // Cache miss, stale, or incomplete - generate new
    console.log('[Dashboard Intelligence] Generating complete dashboard intelligence')
    const result = await generateDashboardIntelligence(profile)

    // Cache the complete result
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
    
    // Graceful fallback
    return buildFallbackIntelligence(profile)
  }
}

/**
 * Fallback dashboard intelligence if API fails
 * 
 * Uses profile data to create basic interpretations
 * Better than showing nothing, worse than Claude
 */
function buildFallbackIntelligence(profile: Profile): CompleteDashboardIntelligence {
  const stage = profile.career_stage || 'building'
  const goal = profile.primary_goal || 'growing your career'
  const constraint = profile.constraints || 'limited time'
  const focus = profile.current_focus || 'next steps'

  return {
    currentRead: `You're at the ${stage} stage, focused on ${goal}. Working within ${constraint}. BLACKBOX is still learning your patterns - check back soon for deeper strategic insights.`,
    identitySummary: profile.context 
      ? profile.context.split('.')[0] + '.' 
      : 'Independent artist building their career.',
    edge: profile.strengths || 'Creative consistency',
    friction: profile.weaknesses || 'Resource constraints',
    constraint: constraint,
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
