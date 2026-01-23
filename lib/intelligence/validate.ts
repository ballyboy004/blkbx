// lib/intelligence/validate.ts
// Quality validation for BLACKBOX intelligence outputs
// Enhanced with personalization validation

import type { Profile } from '@/lib/profile/profile'

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
  /crushing it/i,
  /on fire/i,
  /killing it/i,
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
 * Validates task output with personalization checks
 * 
 * Enhanced to check:
 * - Task structure requirements
 * - Reference to profile data
 * - Specificity (not generic)
 * - Voice quality
 * 
 * @param task - The generated task object
 * @param profile - User profile to check references
 * @returns validation result with specific failure reasons
 */
export function validateTask(
  task: {
    title: string
    reasoning: string
    guardrail: string
    guide?: {
      what: string
      how: string[]
      why: string
    }
  },
  profile: Profile
): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 1. Check for banned phrases in reasoning
  if (BANNED_PHRASES.some(pattern => pattern.test(task.reasoning))) {
    errors.push('Banned motivational phrase detected in reasoning')
  }
  
  // 2. Check title length (5-8 words ideal)
  const titleWords = task.title.split(/\s+/).length
  if (titleWords < 3) {
    errors.push(`Title too short (${titleWords} words, need 3+)`)
  } else if (titleWords > 10) {
    warnings.push(`Title long (${titleWords} words, 5-8 ideal)`)
  }
  
  // 3. Check reasoning length (should be 2+ sentences)
  const reasoningSentences = task.reasoning.split(/[.!?]/).filter(s => s.trim().length > 0)
  if (reasoningSentences.length < 2) {
    errors.push('Reasoning too brief (need 2+ sentences)')
  }
  
  // 4. Check for profile references (CRITICAL FOR PERSONALIZATION)
  const hasProfileReference = checkProfileReferences(task, profile)
  if (!hasProfileReference.valid) {
    errors.push(`Task doesn't reference profile data: ${hasProfileReference.missing.join(', ')}`)
  }
  
  // 5. Check for generic language
  const genericPhrases = [
    /create engaging content/i,
    /build your audience/i,
    /grow your fanbase/i,
    /increase engagement/i,
    /boost your reach/i,
  ]
  
  if (genericPhrases.some(pattern => pattern.test(task.title) || pattern.test(task.reasoning))) {
    warnings.push('Task contains generic marketing language')
  }
  
  // 6. Check guide structure if present
  if (task.guide) {
    if (!task.guide.what || task.guide.what.length < 20) {
      warnings.push('Guide "what" section too vague')
    }
    
    if (!task.guide.how || task.guide.how.length < 2) {
      warnings.push('Guide "how" needs at least 2 steps')
    }
    
    if (!task.guide.why || task.guide.why.length < 20) {
      warnings.push('Guide "why" section too brief')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if task references profile data for personalization
 * 
 * A good task should reference at least 2 of:
 * - Genre/aesthetic
 * - Constraints
 * - Strengths
 * - Stated goal
 * - Specific language from profile
 */
function checkProfileReferences(
  task: { title: string; reasoning: string; guide?: { why: string } },
  profile: Profile
): {
  valid: boolean
  found: string[]
  missing: string[]
} {
  const taskText = `${task.title} ${task.reasoning} ${task.guide?.why || ''}`.toLowerCase()
  const found: string[] = []
  const checks = []
  
  // Check for genre/aesthetic reference
  if (profile.genre_sound) {
    const genre = profile.genre_sound.toLowerCase()
    const genreWords = genre.split(/\s+/)
    
    if (genreWords.some(word => word.length > 3 && taskText.includes(word))) {
      found.push('aesthetic/genre')
    } else {
      checks.push('aesthetic/genre')
    }
  }
  
  // Check for constraint reference
  if (profile.constraints) {
    const constraints = profile.constraints.toLowerCase()
    const constraintKeywords = ['hour', 'time', 'budget', 'burn', 'energy', 'job']
    
    if (constraintKeywords.some(keyword => 
      constraints.includes(keyword) && taskText.includes(keyword)
    )) {
      found.push('constraints')
    } else {
      checks.push('constraints')
    }
  }
  
  // Check for strength reference
  if (profile.strengths) {
    const strengths = profile.strengths.toLowerCase()
    const strengthWords = strengths.split(/\s+/).filter(w => w.length > 4)
    
    if (strengthWords.some(word => taskText.includes(word))) {
      found.push('strengths')
    } else {
      checks.push('strengths')
    }
  }
  
  // Check for specific language from identity/focus
  if (profile.context) {
    const context = profile.context.toLowerCase()
    const uniqueWords = context.split(/\s+/).filter(w => 
      w.length > 5 && !['artist', 'music', 'focused', 'trying'].includes(w)
    )
    
    if (uniqueWords.some(word => taskText.includes(word))) {
      found.push('identity/language')
    }
  }
  
  // Check for goal reference
  if (profile.primary_goal) {
    const goal = profile.primary_goal.toLowerCase()
    const goalWords = goal.split(/\s+/).filter(w => w.length > 4)
    
    if (goalWords.some(word => taskText.includes(word))) {
      found.push('goal')
    }
  }
  
  // Valid if references 2+ elements
  const valid = found.length >= 2
  const missing = checks.filter(c => !found.includes(c))
  
  return {
    valid,
    found,
    missing: valid ? [] : [`Need 2+ references, found ${found.length}: ${found.join(', ') || 'none'}`]
  }
}

/**
 * Validate complete dashboard intelligence output
 */
export function validateDashboardOutput(
  output: {
    currentRead: string
    identitySummary: string
    priorityTask: {
      title: string
      reasoning: string
      guardrail: string
      guide: {
        what: string
        how: string[]
        why: string
      }
    }
  },
  profile: Profile
): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate current read
  if (!validateCurrentRead(output.currentRead)) {
    errors.push('Current read failed validation')
  }
  
  // Validate identity summary
  if (output.identitySummary.length < 20) {
    warnings.push('Identity summary too brief')
  }
  
  // Validate task
  const taskValidation = validateTask(output.priorityTask, profile)
  errors.push(...taskValidation.errors)
  warnings.push(...taskValidation.warnings)
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Manual quality checklist (for human review and testing)
 * 
 * GREEN FLAGS (ship it):
 * - Uses artist's actual words/phrases
 * - Identifies tension between stated goal + constraint
 * - Points to behavioral pattern (overthinking, perfectionism, avoidance)
 * - Reframes limitation as strategic asset
 * - Feels like peer observation, not advice
 * - Would make artist say "wait, that's exactly it"
 * - Task is specific to THIS artist's aesthetic/situation
 * - Could NOT be done the same way by another artist
 * 
 * RED FLAGS (regenerate):
 * - Generic ("You have great potential", "Create engaging content")
 * - Motivational tone ("You got this!")
 * - Corporate speak ("optimize your workflow")
 * - Doesn't reference specific constraints or aesthetic
 * - Restates their words without interpretation
 * - Offers tactics without understanding tension
 * - Could apply to any artist in any genre
 */
export function getQualityChecklist() {
  return {
    greenFlags: [
      'Uses artist\'s actual words/phrases',
      'Identifies tension between stated goal + constraint',
      'Points to behavioral pattern',
      'Reframes limitation as strategic asset',
      'Feels like peer observation, not advice',
      'Would make artist say "wait, that\'s exactly it"',
      'Task is specific to THIS artist\'s aesthetic/situation',
      'Could NOT be done the same way by another artist',
      'References 2+ profile elements (genre, constraint, strength, etc)',
      'Builds on last completed task OR adapts from skip pattern'
    ],
    redFlags: [
      'Generic language ("create engaging content", "build audience")',
      'Motivational tone ("You got this!", "Crushing it!")',
      'Corporate speak ("optimize", "maximize", "leverage")',
      'Doesn\'t reference specific constraints or aesthetic',
      'Restates their words without interpretation',
      'Offers tactics without understanding tension',
      'Could apply to any artist in any genre',
      'Ignores behavioral history (skip patterns or completions)',
      'Randomly switches workflow without reason'
    ]
  }
}

/**
 * Log validation results for monitoring
 */
export function logValidationResult(
  type: 'current_read' | 'task' | 'dashboard',
  result: { valid: boolean; errors: string[]; warnings: string[] }
): void {
  if (!result.valid) {
    console.warn(`[Intelligence] ${type} validation failed:`, {
      errors: result.errors,
      warnings: result.warnings
    })
  } else if (result.warnings.length > 0) {
    console.info(`[Intelligence] ${type} validation passed with warnings:`, {
      warnings: result.warnings
    })
  }
}
