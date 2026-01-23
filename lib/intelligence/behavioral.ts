// lib/intelligence/behavioral.ts
// Behavioral history analysis for task progression

import { createClient } from '@/lib/supabase/server'

/**
 * Get user's behavioral history for strategic question generation
 */
export async function getUserBehavioralHistory(userId: string): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Get recent task completions and skips
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('title, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('[Behavioral History] Error:', error)
      return 'No task history available.'
    }
    
    if (!tasks || tasks.length === 0) {
      return 'No task history yet. First tasks for this user.'
    }
    
    // Format behavioral history
    const historyLines = tasks.map(task => {
      const action = task.status === 'done' ? 'completed' : 'skipped'
      const date = new Date(task.created_at).toLocaleDateString()
      return `${date}: ${action} "${task.title}"`
    })
    
    return historyLines.join('\\n')
    
  } catch (error) {
    console.error('[Behavioral History] Fetch error:', error)
    return 'Unable to load task history.'
  }
}
