'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getProfileByUserId } from '@/lib/profile/profile'
import { getCampaign, getCampaignContext } from '@/lib/modules/campaign/queries'
import { resolveCampaignState } from '@/lib/modules/campaign/state'
import {
  type WorkspaceMessage,
  normalizeWorkspaceMessages,
  buildWorkspaceSystemPrompt,
} from '@/lib/modules/campaign/intelligence'

export async function askBlackbox(
  campaignId: string,
  messages: WorkspaceMessage[]
): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const campaign = await getCampaign(supabase, campaignId, user.id)
  if (!campaign) throw new Error('Campaign not found')

  const { tasks, strategy } = await getCampaignContext(supabase, campaignId, user.id)
  const campaignState = resolveCampaignState(tasks, strategy)

  const profile = await getProfileByUserId(user.id)
  if (!profile) throw new Error('Profile not found')

  const strategyContent = strategy?.content ?? null
  const systemPrompt = buildWorkspaceSystemPrompt(
    profile,
    campaign,
    campaignState,
    strategyContent
  )

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const client = new Anthropic({ apiKey })
  const normalized = normalizeWorkspaceMessages(messages)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: normalized.map((m) => ({ role: m.role, content: m.content })),
  })

  const block = response.content[0]
  if (!block || block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}

export async function generateStrategy(campaignId: string) {
  const { generateStrategy: impl } = await import('@/lib/modules/campaign/actions')
  return impl(campaignId)
}

export async function generateCampaignTasks(campaignId: string) {
  const { generateCampaignTasks: impl } = await import('@/lib/modules/campaign/actions')
  return impl(campaignId)
}
