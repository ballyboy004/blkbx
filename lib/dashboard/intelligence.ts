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
  profileInterpretations: {
    goal: string
    focus: string
    constraints: string
    stage: string
  }
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
      
      // Extract profile interpretations from strategic_context if present
      let profileInterpretations = {
        goal: '',
        focus: '',
        constraints: '',
        stage: ''
      }
      
      let strategicContext = cached.strategic_context || []
      
      if (Array.isArray(cached.strategic_context)) {
        const profileData = cached.strategic_context.find((item: any) => item?._profileInterpretations)
        if (profileData?._profileInterpretations) {
          profileInterpretations = profileData._profileInterpretations
          // Remove the profile interpretations object from strategic context
          strategicContext = cached.strategic_context.filter((item: any) => !item?._profileInterpretations)
        }
      }
      
      // If not found in cache, generate fallback interpretations
      if (!profileInterpretations.goal) {
        profileInterpretations = generateFallbackProfileInterpretations(profile)
      }
      
      return {
        currentRead: cached.current_read,
        identitySummary: cached.identity_summary,
        edge: cached.edge_interpretation,
        friction: cached.friction_interpretation,
        strategicContext: strategicContext,
        priorityTask: {
          title: cached.priority_task_title,
          reasoning: cached.priority_task_reasoning,
          guardrail: cached.priority_task_guardrail,
          guide: cached.priority_task_guide,
        },
        nextActions: cached.next_actions,
        profileInterpretations,
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
function generateFallbackProfileInterpretations(profile: Profile): {
  goal: string
  focus: string
  constraints: string
  stage: string
} {
  const goal = profile.primary_goal || 'growing your career'
  const focus = profile.current_focus || 'next steps'
  const constraints = profile.constraints || 'resource limitations'
  const stage = profile.career_stage || 'building'
  
  return {
    goal: goal ? `You're focused on ${goal}` : 'Your primary goal is being established',
    focus: focus ? `You're working on ${focus}` : 'Your current focus is being determined',
    constraints: constraints ? `You have ${constraints} - forces intentional moves over busy work` : 'Your constraints are being understood',
    stage: `You're at the ${stage} stage - ${getStageDescription(stage)}`
  }
}

function getStageDescription(stage: string): string {
  const descriptions: Record<string, string> = {
    early: 'establishing your sound and initial audience',
    building: 'establishing your sound and audience',
    momentum: 'building momentum with consistent releases',
    breakout: 'expanding reach and breaking through',
    pro: 'operating at a professional level'
  }
  return descriptions[stage] || 'building your career'
}

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
    profileInterpretations: generateFallbackProfileInterpretations(profile),
    source: 'fallback',
  }
}
