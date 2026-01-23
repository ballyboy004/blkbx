// lib/intelligence/task-chat.ts
// Task-contextual chat using centralized BLACKBOX framework

import { createClient } from '@/lib/supabase/server'
import { generateWithClaude } from './claude'
import { buildBLACKBOXSystemPrompt } from './framework'
import type { Profile } from '@/lib/profile/profile'

export type TaskChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type TaskChatHistory = {
  task_title: string
  messages: TaskChatMessage[]
}

/**
 * Generate chat response for task guidance/adaptation
 */
export async function generateTaskChatResponse(
  userId: string,
  taskTitle: string,
  taskDetails: { reasoning: string; guardrail: string; guide: any },
  userMessage: string,
  chatHistory: { role: string; content: string }[],
  profile: Profile
): Promise<{ response: string; shouldUpdateTask: boolean; updatedTask?: any }> {
  
  // Build context-aware prompt for task chat
  const conversationContext = chatHistory.length > 0 
    ? chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
    : ''
  
  const taskChatInstructions = `
TASK CHAT CONTEXT:
Provide immediate help with the current task. Answer specific questions and resolve blocks.

CURRENT TASK: "${taskTitle}"
TASK REASONING: ${taskDetails.reasoning}
TASK GUARDRAIL: ${taskDetails.guardrail}

${conversationContext ? `CONVERSATION SO FAR:\n${conversationContext}\n` : ''}USER: ${userMessage}

Focus on the task at hand. If they want significant changes to the task approach, provide guidance but don't rewrite the entire task.`

  try {
    const systemPrompt = buildBLACKBOXSystemPrompt('task-chat', profile, taskChatInstructions)
    
    const response = await generateWithClaude(systemPrompt, {
      maxTokens: 300,
      temperature: 0.7
    })

    return {
      response: response.text.trim(),
      shouldUpdateTask: false
    }
  } catch (error) {
    console.error('[Task Chat] Claude generation error:', error)
    return {
      response: "I'm having trouble responding right now. Please try again.",
      shouldUpdateTask: false
    }
  }
}

/**
 * Store task chat interaction for behavioral learning
 */
export async function storeTaskChatInteraction(
  userId: string,
  taskTitle: string,
  userMessage: string,
  assistantResponse: string,
  taskWasUpdated: boolean = false
): Promise<void> {
  try {
    const supabase = await createClient()
    
    // Store in reflections table as task chat interaction
    await supabase
      .from('reflections')
      .insert({
        user_id: userId,
        content: `Task Chat - "${taskTitle}"\nUser: ${userMessage}\nAssistant: ${assistantResponse}${taskWasUpdated ? '\n[Task was adapted based on this interaction]' : ''}`,
        linked_task_id: null, // Could link to task if we store task IDs
        created_at: new Date().toISOString()
      })
    
    console.log(`[Task Chat] Stored interaction for user ${userId} on task "${taskTitle}"`)
  } catch (error) {
    console.error('[Task Chat] Failed to store interaction:', error)
  }
}
