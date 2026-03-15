import { redirect } from 'next/navigation'
import { getAuthedUserOrRedirect } from '@/lib/profile/profile'
import { createClient } from '@/lib/supabase/server'
import { getCampaign, getCampaignContext } from '@/lib/modules/campaign/queries'
import { resolveCampaignState } from '@/lib/modules/campaign/state'
import {
  buildMissionCardData,
  resolveWorkspaceChips,
  type MissionCardData,
  type WorkspaceChip,
} from '@/lib/modules/campaign/intelligence'
import { WorkspaceScreen } from '@/components/workspace/WorkspaceScreen'

type PageProps = { params: Promise<{ id: string }> }

export default async function WorkspacePage({ params }: PageProps) {
  const { user } = await getAuthedUserOrRedirect('/')
  if (!user) return null

  const { id: campaignId } = await params
  const supabase = await createClient()

  const campaign = await getCampaign(supabase, campaignId, user.id)
  if (!campaign) redirect('/dashboard')

  const { tasks, strategy } = await getCampaignContext(supabase, campaignId, user.id)
  const campaignState = resolveCampaignState(tasks, strategy)

  const mission: MissionCardData = buildMissionCardData(campaign, campaignState)
  const chips: WorkspaceChip[] = resolveWorkspaceChips(campaignState)

  return (
    <WorkspaceScreen
      campaignId={campaignId}
      mission={mission}
      chips={chips}
    />
  )
}
