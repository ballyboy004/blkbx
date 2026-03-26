import { redirect } from 'next/navigation'
import { getAuthedUserOrRedirect } from '@/lib/profile/profile'
import { createClient } from '@/lib/supabase/server'
import { getActiveCampaign, getCampaignContext, getPendingAssets } from '@/lib/modules/campaign/queries'
import { resolveCampaignState } from '@/lib/modules/campaign/state'
import {
  buildMissionCardData,
  buildWorkItems,
  resolveWorkspaceChips,
  type MissionCardData,
  type WorkspaceChip,
  type WorkItem,
} from '@/lib/modules/campaign/intelligence'
import { WorkspaceScreen } from '@/components/workspace/WorkspaceScreen'

export default async function DashboardPage() {
  const { user } = await getAuthedUserOrRedirect('/')
  if (!user) return null

  const supabase = await createClient()

  const activeCampaign = await getActiveCampaign(supabase, user.id)
  if (!activeCampaign) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
    redirect(profile?.onboarding_completed ? '/campaign/new' : '/onboarding')
  }

  const campaignId = activeCampaign.id
  const campaign = activeCampaign

  const { tasks, strategy } = await getCampaignContext(supabase, campaignId, user.id)
  const campaignState = resolveCampaignState(tasks, strategy)

  const pendingAssets = await getPendingAssets(supabase, campaignId, user.id)
  const workItems: WorkItem[] = buildWorkItems(pendingAssets)

  const mission: MissionCardData = buildMissionCardData(campaign, campaignState, pendingAssets)
  const chips: WorkspaceChip[] = resolveWorkspaceChips(campaignState, pendingAssets.length > 0)

  const PHASE_ORDER = ['preparation', 'launch', 'post_release']
  const pendingTasks = tasks
    .filter(t => t.parent_id !== null && t.status === 'pending')
    .sort((a, b) => {
      const phaseA = PHASE_ORDER.indexOf(a.phase)
      const phaseB = PHASE_ORDER.indexOf(b.phase)
      if (phaseA !== phaseB) return phaseA - phaseB
      return a.order_index - b.order_index
    })
    .map(t => {
      const milestone = tasks.find(m => m.id === t.parent_id)
      return {
        id: t.id,
        title: t.title,
        phase: t.phase,
        milestoneTitle: milestone?.title ?? null,
        description: t.description ?? null,
        aiContext: t.ai_context ?? null,
      }
    })

  const PHASE_LABELS: Record<string, string> = {
    preparation: 'Preparation',
    launch: 'Launch',
    post_release: 'After Release',
  }

  const completedTasks = tasks
    .filter(t => t.parent_id !== null && (t.status === 'done' || t.status === 'skipped'))
    .sort((a, b) => {
      const phaseA = PHASE_ORDER.indexOf(a.phase)
      const phaseB = PHASE_ORDER.indexOf(b.phase)
      if (phaseA !== phaseB) return phaseA - phaseB
      return a.order_index - b.order_index
    })
    .map(t => ({
      id: t.id,
      title: t.title,
      phase: t.phase,
      phaseLabel: PHASE_LABELS[t.phase] ?? t.phase,
      status: t.status as 'done' | 'skipped',
      deliverableNote: t.deliverable_note ?? null,
    }))

  return (
    <WorkspaceScreen
      campaignId={campaignId}
      mission={mission}
      chips={chips}
      workItems={workItems}
      nextTaskId={campaignState.nextTask?.id ?? null}
      nextTaskTitle={campaignState.nextTask?.title ?? null}
      allTasks={pendingTasks}
      completedTasks={completedTasks}
    />
  )
}
