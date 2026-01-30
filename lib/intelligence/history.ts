// lib/intelligence/history.ts
// Fetches user behavioral history for intelligence generation

import { createClient } from '@/lib/supabase/server'

export type TaskHistoryItem = {
  id: string
  title: string
  status: 'done' | 'skipped'
  completed_at: string
  reflection?: string
  reasoning?: string
  guardrail?: string
  skip_reason?: string
}

export type BehavioralHistory = {
  recentTasks: TaskHistoryItem[]
  taskStats: {
    completed: number
    skipped: number
    completionRate: number
  }
  recentReflections: string[]
  patterns: {
    completedTypes: string[]
    skippedTypes: string[]
  }
}

/**
 * Fetch recent task history and reflections for a user
 */
export async function getBehavioralHistory(
  userId: string,
  options: { limit?: number } = {}
): Promise<BehavioralHistory> {
  const limit = options.limit || 20
  const supabase = await createClient()

  try {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, task_name, status, completed_at, reflection, reasoning, guardrail, skip_reason')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (tasksError) {
      console.error('[History] Tasks query error:', JSON.stringify(tasksError, null, 2))
      return emptyHistory()
    }

    if (!tasks || tasks.length === 0) {
      return emptyHistory()
    }

    const filteredTasks = tasks.filter(t => t.status === 'done' || t.status === 'skipped')
    
    if (filteredTasks.length === 0) {
      return emptyHistory()
    }

    const recentTasks: TaskHistoryItem[] = filteredTasks.map(task => ({
      id: task.id,
      title: task.title || task.task_name || 'Unknown task',
      status: task.status as 'done' | 'skipped',
      completed_at: task.completed_at,
      reflection: task.reflection || undefined,
      reasoning: task.reasoning || undefined,
      guardrail: task.guardrail || undefined,
      skip_reason: (task as { skip_reason?: string }).skip_reason || undefined
    }))

    const completed = recentTasks.filter(t => t.status === 'done').length
    const skipped = recentTasks.filter(t => t.status === 'skipped').length
    const total = completed + skipped
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const recentReflections = recentTasks
      .filter(t => t.reflection && t.status === 'done')
      .map(t => t.reflection!)
      .slice(0, 10)

    const completedTypes = recentTasks
      .filter(t => t.status === 'done')
      .map(t => t.title)
      .slice(0, 5)

    const skippedTypes = recentTasks
      .filter(t => t.status === 'skipped')
      .map(t => t.title)
      .slice(0, 5)

    return {
      recentTasks,
      taskStats: { completed, skipped, completionRate },
      recentReflections,
      patterns: { completedTypes, skippedTypes }
    }
  } catch (error) {
    console.error('[History] Unexpected error:', error)
    return emptyHistory()
  }
}

function emptyHistory(): BehavioralHistory {
  return {
    recentTasks: [],
    taskStats: { completed: 0, skipped: 0, completionRate: 0 },
    recentReflections: [],
    patterns: { completedTypes: [], skippedTypes: [] }
  }
}

export type TaskCompletionStats = {
  completed: number
  skipped: number
  completionRate: number
  skipReasonCounts: Record<string, number>
}

/**
 * Query task completion stats for the current user (all-time).
 * Used for dashboard display and intelligence context.
 */
export async function getTaskCompletionStats(userId: string): Promise<TaskCompletionStats> {
  const supabase = await createClient()
  try {
    const [doneRes, skippedRes, skippedReasonsRes] = await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'done'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'skipped'),
      supabase.from('tasks').select('skip_reason').eq('user_id', userId).eq('status', 'skipped').not('skip_reason', 'is', null)
    ])
    const completed = doneRes.count ?? 0
    const skipped = skippedRes.count ?? 0
    const total = completed + skipped
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const skipReasonCounts: Record<string, number> = {}
    if (skippedReasonsRes.data) {
      for (const row of skippedReasonsRes.data) {
        const r = (row as { skip_reason?: string }).skip_reason?.trim()
        if (r) {
          skipReasonCounts[r] = (skipReasonCounts[r] ?? 0) + 1
        }
      }
    }
    return { completed, skipped, completionRate, skipReasonCounts }
  } catch (error) {
    console.error('[History] getTaskCompletionStats error:', error)
    return { completed: 0, skipped: 0, completionRate: 0, skipReasonCounts: {} }
  }
}

/**
 * Format behavioral history for inclusion in prompt
 * Emphasizes MOST RECENT completed task for proper sequencing
 */
export function formatHistoryForPrompt(history: BehavioralHistory): string {
  if (history.recentTasks.length === 0) {
    return 'No task history yet. This is a NEW USER - generate a starting task for their campaign.'
  }

  const lines: string[] = []

  // Find most recent COMPLETED task - this is critical for sequencing
  const lastCompleted = history.recentTasks.find(t => t.status === 'done')
  
  if (lastCompleted) {
    lines.push('═══════════════════════════════════════════════════════')
    lines.push('MOST RECENT COMPLETED TASK (generate the NEXT step after this):')
    lines.push(`→ "${lastCompleted.title}"`)
    if (lastCompleted.reflection) {
      lines.push(`   User note: "${lastCompleted.reflection}"`)
    }
    lines.push('═══════════════════════════════════════════════════════')
    lines.push('')
    lines.push('YOUR NEXT TASK MUST LOGICALLY FOLLOW FROM THIS.')
    lines.push('Examples of what comes AFTER content creation:')
    lines.push('- If they filmed → next is EDIT or POST')
    lines.push('- If they edited → next is POST or SCHEDULE')
    lines.push('- If they posted → next is ENGAGE or ANALYZE')
    lines.push('')
    lines.push('DO NOT generate a task that comes BEFORE what they just did.')
    lines.push('DO NOT ask them to plan something they already created.')
    lines.push('')
  }

  // Recent skipped tasks - avoid these approaches
  const skippedTasks = history.recentTasks.filter(t => t.status === 'skipped')
  if (skippedTasks.length > 0) {
    lines.push('SKIPPED TASKS (user rejected these - try different approach):')
    skippedTasks.slice(0, 3).forEach(task => {
      lines.push(`  ✗ "${task.title}"`)
    })
    lines.push('')
  }

  // Skip reasons - adjust next task accordingly
  const skipReasons = skippedTasks
    .map(t => t.skip_reason)
    .filter((r): r is string => !!r?.trim())
    .slice(0, 10)
  if (skipReasons.length > 0) {
    lines.push('USER RECENTLY SKIPPED TASKS BECAUSE:')
    lines.push(skipReasons.map(r => `  • ${r}`).join('\n'))
    lines.push('Adjust accordingly (e.g. smaller scope, different type, or complementary angle).')
    lines.push('')
  }

  // Full history for context
  lines.push(`Task Stats: ${history.taskStats.completed} completed, ${history.taskStats.skipped} skipped`)

  return lines.join('\n')
}
