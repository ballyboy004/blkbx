// lib/intelligence/strategic/questions.ts
// Contextual Strategic Question Generation

import type { Profile } from '@/lib/profile/profile'

/**
 * Generate contextual strategic questions based on current task and user's profile
 */
export function generateStrategicQuestion(
  profile: Profile, 
  currentTask?: { title: string; reasoning: string; guardrail: string },
  behavioralHistory?: string
): string {
  
  // If there's a current task, create questions that help refine/redirect it
  if (currentTask) {
    const taskTitle = currentTask.title.toLowerCase()
    const taskReasoning = currentTask.reasoning.toLowerCase()
    
    // Vulnerability/storytelling content questions
    if (taskTitle.includes('vulnerability') || taskTitle.includes('story') || taskTitle.includes('personal')) {
      return `Your current approach is vulnerability-driven content. Maybe that feels too exposed or not authentic to you - how do YOU actually want to share your story?`
    }
    
    // Technical/skill content questions  
    if (taskTitle.includes('technical') || taskTitle.includes('skill') || taskTitle.includes('behind')) {
      return `You're being asked to show technical skills, but maybe that feels too "show-offy" or not your style. What feels like authentic way to share your craft?`
    }
    
    // Posting/social content questions
    if (taskTitle.includes('post') || taskTitle.includes('tiktok') || taskTitle.includes('instagram') || taskTitle.includes('content')) {
      return `This task assumes you want to create ${taskTitle.includes('tiktok') ? 'TikTok' : 'social'} content regularly. But maybe that's not how you work - what would actually fit your creative process?`
    }
    
    // Music creation questions
    if (taskTitle.includes('write') || taskTitle.includes('record') || taskTitle.includes('produce') || taskTitle.includes('song')) {
      return `The current approach focuses on ${taskTitle.includes('write') ? 'writing' : taskTitle.includes('record') ? 'recording' : 'production'}. But maybe your strength lies elsewhere - what's your natural creative starting point?`
    }
    
    // Audience/marketing questions
    if (taskTitle.includes('audience') || taskTitle.includes('fan') || taskTitle.includes('market')) {
      return `This approach assumes traditional audience building tactics. Given your constraints and style, what would genuinely connect people to your music?`
    }
    
    // Release/distribution questions
    if (taskTitle.includes('release') || taskTitle.includes('distribute') || taskTitle.includes('playlist')) {
      return `Standard release strategies might not fit your situation. Considering your actual resources and timeline, how do you want people to discover this music?`
    }
    
    // Generic task refinement - analyze the reasoning for tensions
    if (taskReasoning.includes('should') || taskReasoning.includes('need to') || taskReasoning.includes('most artists')) {
      return `This task makes assumptions about what you "should" do. But you're not most artists - what approach would actually work for YOUR situation and preferences?`
    }
    
    // Default task-specific question
    return `The current task is "${currentTask.title.toLowerCase()}." Maybe this approach doesn't feel right for you - what would feel more aligned with how you actually want to work?`
  }
  
  // Fallback to user-context questions if no task (original logic)
  // ... rest of original logic for when there's no current task
  
  // Analyze behavioral history for patterns
  const hasCreatedContent = behavioralHistory?.includes('completed') && 
    (behavioralHistory.includes('video') || behavioralHistory.includes('content') || behavioralHistory.includes('clip'))
  
  const hasSkippedTasks = behavioralHistory?.includes('skipped')
  
  const hasPostedContent = behavioralHistory?.includes('post') && behavioralHistory.includes('completed')
  
  // Analyze profile for key tensions
  const isEarly = profile.career_stage === 'early' || profile.career_stage === 'building'
  const hasAudienceGoal = profile.primary_goal?.toLowerCase().includes('fan') || 
    profile.primary_goal?.toLowerCase().includes('listener') || 
    profile.primary_goal?.toLowerCase().includes('audience')
  
  const hasStreamingGoal = profile.primary_goal?.toLowerCase().includes('stream') || 
    profile.primary_goal?.toLowerCase().includes('play')
  
  const hasTimeConstraints = profile.constraints?.toLowerCase().includes('time') || 
    profile.constraints?.toLowerCase().includes('hour') ||
    profile.constraints?.toLowerCase().includes('busy')
  
  const hasBudgetConstraints = profile.constraints?.toLowerCase().includes('budget') || 
    profile.constraints?.toLowerCase().includes('money') ||
    profile.constraints?.toLowerCase().includes('cost')
  
  // Generate contextual questions based on situation
  
  // If they've created content but haven't posted strategically
  if (hasCreatedContent && !hasPostedContent) {
    return "You've created content but distribution strategy matters more than creation volume. How do you want to strategically deploy what you've made?"
  }
  
  // If they keep skipping tasks
  if (hasSkippedTasks) {
    return `Your ${profile.constraints || 'constraints'} are creating friction with standard approaches. What would actually work within your real limitations?`
  }
  
  // If they have audience goals but are early stage
  if (hasAudienceGoal && isEarly) {
    return `Building ${profile.primary_goal?.includes('1000') ? '1000' : 'your first'} true fans requires more than just posting regularly. How do you want people to discover and remember you?`
  }
  
  // If they have streaming goals
  if (hasStreamingGoal) {
    return `Streaming numbers come from repeat listeners, not one-time plays. What kind of relationship do you want to build with people who find your music?`
  }
  
  // Time-constrained artists
  if (hasTimeConstraints) {
    return `Your time constraints require focus over volume. Which single approach would have the highest impact on your specific goal?`
  }
  
  // Budget-constrained artists  
  if (hasBudgetConstraints) {
    return `Budget constraints can be an advantage \u2014 they force creativity over spending. How do you want to leverage constraints as part of your approach?`
  }
  
  // Genre-specific differentiation
  if (profile.genre_sound) {
    const genre = profile.genre_sound.toLowerCase()
    if (genre.includes('hip hop') || genre.includes('rap') || genre.includes('trap')) {
      return `The hip-hop space rewards authenticity and story over polish. What's your unique angle that cuts through the noise?`
    }
    if (genre.includes('electronic') || genre.includes('edm') || genre.includes('house')) {
      return `Electronic music fans value both technical skill and emotional connection. How do you want to balance showing your craft with creating feeling?`
    }
    if (genre.includes('indie') || genre.includes('alternative')) {
      return `Indie audiences seek authentic artistic vision over mainstream appeal. How do you want to build a cult following around your specific sound?`
    }
    if (genre.includes('r&b') || genre.includes('soul')) {
      return `R&B connects through vulnerable storytelling and vocal authenticity. How do you want to share your perspective while staying true to yourself?`
    }
  }
  
  // Career stage specific questions
  if (isEarly) {
    return `Early-stage artists need to establish their artistic identity before chasing numbers. What specific feeling or story do you want people to associate with your music?`
  }
  
  if (profile.career_stage === 'momentum') {
    return `You have momentum but need to channel it strategically. How do you want to scale what's working without losing what makes you unique?`
  }
  
  if (profile.career_stage === 'pro') {
    return `At your level, strategic positioning matters more than tactics. How do you want to evolve your approach to reach the next tier?`
  }
  
  // Default contextual question based on primary goal
  if (profile.primary_goal) {
    return `Your goal is ${profile.primary_goal.toLowerCase()}. Most artists try everything \u2014 what's your focused approach to get there?`
  }
  
  // Ultimate fallback (should rarely hit this)
  return `Your music career needs strategic focus over scattered effort. What's the one approach that aligns with how you actually work?`
}

/**
 * Get strategic question with context for UI display
 */
export function getContextualStrategicQuestion(
  profile: Profile,
  currentTask?: { title: string; reasoning: string; guardrail: string },
  behavioralHistory?: string
): {
  question: string
  context: string
} {
  const question = generateStrategicQuestion(profile, currentTask, behavioralHistory)
  
  // Add context about why this question matters
  let context = "Strategic decisions shape long-term career trajectory more than daily tactics."
  
  // Task-specific context
  if (currentTask) {
    context = "This helps you refine the current approach to better fit your actual style and preferences."
  } else if (behavioralHistory?.includes('skipped')) {
    context = "Understanding what actually works for your situation prevents repeated friction."
  }
  
  if (profile.career_stage === 'early') {
    context = "Early strategic choices determine which opportunities become available later."
  }
  
  if (profile.constraints?.toLowerCase().includes('time')) {
    context = "Time constraints require strategic focus \u2014 every action should compound."
  }
  
  return { question, context }
}
