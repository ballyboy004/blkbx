// lib/intelligence/validate.ts
// Quality validation for BLACKBOX intelligence outputs
// Design: BLACKBOX_V1_INTELLIGENCE_LAYER_DESIGN.md

/**
 * Banned phrases that indicate non-BLACKBOX voice
 * These trigger automatic rejection of generated content
 */
const BANNED_PHRASES = [
  /you got this/i,
  /you can do it/i,
  /let's crush/i,
  /let's optimize/i,
  /let's maximize/i,
  /your journey/i,
  /exciting times/i,
  /based on your profile/i,
  /here's your personalized/i,
  /i'm here to help/i,
  /great job/i,
  /you're amazing/i,
  /keep it up/i,
]

/**
 * Validates a Current Read output
 * 
 * Checks for:
 * - Banned phrases (motivation/hype language)
 * - Appropriate length (2-5 sentences)
 * - Minimum content depth (>100 chars)
 * - Maximum content depth (<800 chars)
 * 
 * @param read - The generated current read text
 * @returns true if valid, false if should regenerate
 */
export function validateCurrentRead(read: string): boolean {
  // 1. Check for banned phrases
  if (BANNED_PHRASES.some(pattern => pattern.test(read))) {
    console.warn('[Intelligence] Validation failed: Banned phrase detected', {
      read: read.substring(0, 100) + '...'
    })
    return false
  }
  
  // 2. Check length (2-5 sentences)
  const sentences = read.split(/[.!?]/).filter(s => s.trim().length > 0)
  if (sentences.length < 2 || sentences.length > 5) {
    console.warn('[Intelligence] Validation failed: Sentence count outside 2-5', {
      count: sentences.length,
      read: read.substring(0, 100) + '...'
    })
    return false
  }
  
  // 3. Check for minimum length (too short = generic)
  if (read.length < 100) {
    console.warn('[Intelligence] Validation failed: Read too short (<100 chars)', {
      length: read.length
    })
    return false
  }
  
  // 4. Check for maximum length (too long = rambling)
  if (read.length > 800) {
    console.warn('[Intelligence] Validation failed: Read too long (>800 chars)', {
      length: read.length
    })
    return false
  }
  
  return true
}

/**
 * Manual quality checklist (for human review)
 * 
 * GREEN FLAGS (ship it):
 * - Uses artist's actual words/phrases
 * - Identifies tension between stated goal + constraint
 * - Points to behavioral pattern (overthinking, perfectionism, avoidance)
 * - Reframes limitation as strategic asset
 * - Feels like peer observation, not advice
 * - Would make artist say "wait, that's exactly it"
 * 
 * RED FLAGS (regenerate):
 * - Generic ("You have great potential")
 * - Motivational tone ("You got this!")
 * - Corporate speak ("optimize your workflow")
 * - Doesn't reference specific constraints
 * - Restates their words without interpretation
 * - Offers tactics without understanding tension
 */
export function getQualityChecklist() {
  return {
    greenFlags: [
      'Uses artist\'s actual words/phrases',
      'Identifies tension between stated goal + constraint',
      'Points to behavioral pattern (overthinking, perfectionism, avoidance)',
      'Reframes limitation as strategic asset',
      'Feels like peer observation, not advice',
      'Would make artist say "wait, that\'s exactly it"'
    ],
    redFlags: [
      'Generic ("You have great potential")',
      'Motivational tone ("You got this!")',
      'Corporate speak ("optimize your workflow")',
      'Doesn\'t reference specific constraints',
      'Restates their words without interpretation',
      'Offers tactics without understanding tension'
    ]
  }
}

/**
 * Validates task output (Phase 2)
 * Deferred until task generation is implemented
 */
export function validateTask(task: {
  title: string
  reasoning: string
  guardrail: string
}): boolean {
  // TODO: Implement task validation
  // - Title should be 5-8 words
  // - Reasoning should be 2-3 sentences
  // - Guardrail should be 1 sentence
  // - Should reference profile constraints
  return true
}
