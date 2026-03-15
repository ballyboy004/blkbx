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
  nextTask: CampaignTask | null
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
  const phases: PhaseProgress[] = PHASE_ORDER.map((phase) => {
    const phaseTasks = tasks
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

  let nextTask: CampaignTask | null = null
  for (const phase of PHASE_ORDER) {
    const phaseTasks = tasks
      .filter((t) => t.phase === phase)
      .sort((a, b) => a.order_index - b.order_index)
    for (const task of phaseTasks) {
      if (task.status === 'pending') {
        nextTask = task
        break
      }
    }
    if (nextTask) break
  }

  const currentPhase = nextTask?.phase ?? null

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const skippedTasks = tasks.filter((t) => t.status === 'skipped').length
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length

  const hasTasks = tasks.length > 0
  const hasStrategy =
    strategy !== null &&
    strategy.content !== null &&
    strategy.content.length > 0
  const isComplete = hasTasks && pendingTasks === 0

  return {
    currentPhase,
    nextTask,
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
