// lib/intelligence/framework.ts
// BLACKBOX Intelligence Framework - Optimized for speed

import type { Profile } from '@/lib/profile/profile'

/**
 * Build complete system prompt for BLACKBOX AI contexts
 */
export function buildBLACKBOXSystemPrompt(
  context: 'dashboard' | 'task-chat' | 'strategic-task',
  profile: Profile,
  additionalInstructions?: string
): string {
  
  const coreFramework = `You are BLACKBOX — an artist's strategic assistant.

VOICE: Direct, grounded, second-person ("you"). No hype, no motivational speak.

DATA INTEGRITY: Only reference data explicitly provided below. Never invent past experiences or metrics.`

  const contextRules = getContextRules(context)
  
  const profileData = `
ARTIST:
Context: ${profile.context || '[Not provided]'}
Goal: ${profile.primary_goal || '[Not provided]'}
Genre: ${profile.genre_sound || '[Not provided]'}
Stage: ${profile.career_stage || '[Not provided]'}
Strengths: ${profile.strengths || '[Not provided]'}
Weaknesses: ${profile.weaknesses || '[Not provided]'}
Constraints: ${profile.constraints || '[Not provided]'}
Focus: ${profile.current_focus || '[Not provided]'}
Content Activity: ${profile.content_activity || '[Not provided]'}
Release Status: ${profile.release_status || '[Not provided]'}
Stuck On: ${profile.stuck_on || '[Not provided]'}`

  const additional = additionalInstructions ? `\n${additionalInstructions}` : ''

  return `${coreFramework}\n\n${contextRules}${profileData}${additional}`
}

function getContextRules(context: 'dashboard' | 'task-chat' | 'strategic-task'): string {
  switch (context) {
    case 'dashboard':
      return `OUTPUT JSON (no markdown):
{
  "currentRead": "2-3 sentences on your core tension",
  "identitySummary": "One sentence — who you are",
  "edge": "Your strength",
  "friction": "What's blocking you",
  "strategicContext": ["observation 1", "observation 2", "observation 3"],
  "priorityTask": {
    "title": "Specific task (5-8 words)",
    "reasoning": "Why this matters for you (2 sentences)",
    "guardrail": "What to watch out for",
    "guide": {
      "what": "What you're doing",
      "how": ["Step 1", "Step 2", "Step 3"],
      "why": "Why this approach works"
    }
  },
  "nextActions": ["action 1", "action 2", "action 3"]
}`

    case 'task-chat':
      return `Help with the current task. Keep responses focused and conversational.`

    case 'strategic-task':
      return `OUTPUT JSON:
{
  "title": "Strategic action (5-8 words)",
  "reasoning": "Why this serves your goals (2 sentences)",
  "guardrail": "What to watch out for",
  "guide": {
    "what": "What you're creating and deploying",
    "how": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "why": "Why this works for you"
  }
}`

    default:
      return ''
  }
}

/**
 * Add behavioral history context to any prompt
 */
export function addBehavioralHistoryContext(
  systemPrompt: string, 
  behavioralHistory?: string
): string {
  if (!behavioralHistory) {
    return systemPrompt + `\n\nNo task history yet. Focus on profile data for reasoning.`
  }
  
  return systemPrompt + `\n\nHISTORY:\n${behavioralHistory}\n\nBuild on completed tasks. Adjust if tasks were skipped.`
}
