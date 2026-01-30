'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type TaskData = {
  title: string
  reasoning?: string
  guardrail?: string
}

/**
 * Server Action: Complete a task
 * 
 * Records task as done with optional reflection,
 * and clears intelligence cache to generate new task.
 */
export async function completeTask(
  task: TaskData,
  reflection?: string
): Promise<{ success: boolean; error?: string; taskId?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Record the completed task with reflection directly on the task row
    const { data: taskRecords, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        task_name: task.title,
        title: task.title,
        reasoning: task.reasoning || null,
        guardrail: task.guardrail || null,
        status: 'done',
        completed_at: new Date().toISOString(),
        reflection: reflection?.trim() || null,  // Store reflection directly on task
      })
      .select('id')

    if (insertError) {
      console.error('[Task Complete] Insert error:', JSON.stringify(insertError, null, 2))
      return { success: false, error: 'Failed to record task completion' }
    }

    const taskId = taskRecords?.[0]?.id
    console.log('[Task Complete] Recorded:', task.title, 'ID:', taskId, 'Has reflection:', !!reflection)

    // Clear ONLY the task-related cache fields, preserve Current Read
    const { error: cacheError } = await supabase
      .from('interpretations')
      .update({
        priority_task_title: null,
        priority_task_reasoning: null,
        priority_task_guardrail: null,
        priority_task_guide: null,
        next_actions: null,
      })
      .eq('user_id', user.id)

    if (cacheError) {
      console.warn('[Task Complete] Cache clear warning:', cacheError)
    }

    revalidatePath('/dashboard')

    return { success: true, taskId }
  } catch (error) {
    console.error('[Task Complete] Unexpected error:', error)
    return { success: false, error: 'Unexpected error' }
  }
}

/**
 * Server Action: Skip a task
 * 
 * Records task as skipped with optional skip_reason and clears intelligence cache.
 */
export async function skipTask(
  task: TaskData,
  skipReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Record the skipped task
    const { error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        task_name: task.title,
        title: task.title,
        reasoning: task.reasoning || null,
        guardrail: task.guardrail || null,
        status: 'skipped',
        completed_at: new Date().toISOString(),
        skip_reason: skipReason?.trim() || null,
      })

    if (insertError) {
      console.error('[Task Skip] Insert error:', JSON.stringify(insertError, null, 2))
      return { success: false, error: 'Failed to record task skip' }
    }

    console.log('[Task Skip] Recorded:', task.title)

    // Clear ONLY the task-related cache fields, preserve Current Read
    const { error: cacheError } = await supabase
      .from('interpretations')
      .update({
        priority_task_title: null,
        priority_task_reasoning: null,
        priority_task_guardrail: null,
        priority_task_guide: null,
        next_actions: null,
      })
      .eq('user_id', user.id)

    if (cacheError) {
      console.warn('[Task Skip] Cache clear warning:', cacheError)
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('[Task Skip] Unexpected error:', error)
    return { success: false, error: 'Unexpected error' }
  }
}
