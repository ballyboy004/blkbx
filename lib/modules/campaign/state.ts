import type { CampaignTask, CampaignTaskPhase, ContentPiece } from './types'

export const PHASE_ORDER: CampaignTaskPhase[] = [
  'preparation',
  'launch',
  'post_release',
]

export const PHASE_LABELS: Record<CampaignTaskPhase, string> = {
  preparation: 'Phase 1 — Preparation',
  launch: 'Phase 2 — Launch',
  post_release: 'Phase 3 — After Release',
}

export type PhaseProgress = {
  phase: CampaignTaskPhase
  label: string
  tasks: CampaignTask[]
  total: number
  completed: number
  pending: number
}

export type CampaignState = {
  currentPhase: CampaignTaskPhase | null
  nextTask: CampaignTask | null         // always a sub-task, never a milestone
  currentMilestone: CampaignTask | null // the parent milestone of nextTask
  phases: PhaseProgress[]
  totalTasks: number
  completedTasks: number
  skippedTasks: number
  pendingTasks: number
  hasTasks: boolean
  hasStrategy: boolean
  isComplete: boolean
}

export function resolveCampaignState(
  tasks: CampaignTask[],
  strategy: ContentPiece | null
): CampaignState {
  // Separate milestones (parent_id = null) from sub-tasks (parent_id set)
  const milestones = tasks.filter((t) => t.parent_id === null)
  const subTasks = tasks.filter((t) => t.parent_id !== null)

  // If there are no sub-tasks, fall back to treating all tasks as flat
  // (backwards compat with old campaigns before milestone structure)
  const executableTasks = subTasks.length > 0 ? subTasks : tasks

  // Build phase progress using executable tasks only
  const phases: PhaseProgress[] = PHASE_ORDER.map((phase) => {
    const phaseTasks = executableTasks
      .filter((t) => t.phase === phase)
      .sort((a, b) => a.order_index - b.order_index)
    const completed = phaseTasks.filter(
      (t) => t.status === 'done' || t.status === 'skipped'
    ).length
    const pending = phaseTasks.filter((t) => t.status === 'pending').length
    return {
      phase,
      label: PHASE_LABELS[phase],
      tasks: phaseTasks,
      total: phaseTasks.length,
      completed,
      pending,
    }
  })

  // Find next pending executable task — ordered by phase then order_index
  let nextTask: CampaignTask | null = null
  let currentMilestone: CampaignTask | null = null

  for (const phase of PHASE_ORDER) {
    const phaseTasks = executableTasks
      .filter((t) => t.phase === phase)
      .sort((a, b) => a.order_index - b.order_index)
    for (const task of phaseTasks) {
      if (task.status === 'pending') {
        nextTask = task
        // Resolve parent milestone if it exists
        if (task.parent_id) {
          currentMilestone = milestones.find((m) => m.id === task.parent_id) ?? null
        }
        break
      }
    }
    if (nextTask) break
  }

  const currentPhase = nextTask?.phase ?? null

  const totalTasks = executableTasks.length
  const completedTasks = executableTasks.filter((t) => t.status === 'done').length
  const skippedTasks = executableTasks.filter((t) => t.status === 'skipped').length
  const pendingTasks = executableTasks.filter((t) => t.status === 'pending').length

  const hasTasks = executableTasks.length > 0
  const hasStrategy =
    strategy !== null &&
    strategy.content !== null &&
    strategy.content.length > 0
  const isComplete = hasTasks && pendingTasks === 0

  return {
    currentPhase,
    nextTask,
    currentMilestone,
    phases,
    totalTasks,
    completedTasks,
    skippedTasks,
    pendingTasks,
    hasTasks,
    hasStrategy,
    isComplete,
  }
}
