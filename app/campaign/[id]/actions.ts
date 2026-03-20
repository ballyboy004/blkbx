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

export async function generateAssets(campaignId: string) {
  const { generateAssets: impl } = await import('@/lib/modules/campaign/actions')
  return impl(campaignId)
}

export async function completeTask(taskId: string, taskTitle: string, status: 'done' | 'skipped', campaignId: string) {
  const { completeTask: impl } = await import('@/lib/modules/campaign/actions')
  return impl(taskId, taskTitle, status, campaignId)
}

export async function saveTaskDeliverable(taskId: string, note: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')
  const { saveDeliverableNote } = await import('@/lib/modules/campaign/mutations')
  await saveDeliverableNote(supabase, taskId, user.id, note)
}

export async function generateTaskBrief(taskId: string, campaignId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { data: task } = await supabase
    .from('campaign_tasks')
    .select('ai_context, title, description, phase')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (!task) throw new Error('Task not found')
  if (task.ai_context) return task.ai_context

  const profile = await getProfileByUserId(user.id)
  if (!profile) throw new Error('Profile not found')

  const campaign = await getCampaign(supabase, campaignId, user.id)
  if (!campaign) throw new Error('Campaign not found')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const client = new Anthropic({ apiKey })

  const systemPrompt = `You are a music industry execution coach embedded in an artist's campaign tool.
Write a concise step-by-step execution guide for a single campaign task.
Write for THIS artist specifically — not generic advice.

Artist profile:
- Name: ${profile.artist_name ?? 'Unknown'}
- Genre/Sound: ${profile.genre_sound ?? 'Not specified'}
- Career stage: ${profile.career_stage ?? 'Not specified'}
- Strengths: ${profile.strengths ?? 'Not specified'}
- Constraints: ${profile.constraints ?? 'Not specified'}
- Primary goal: ${profile.primary_goal ?? 'Not specified'}

Campaign: ${campaign.title}${campaign.release_type ? ` (${campaign.release_type})` : ''}${campaign.release_date ? ` — releasing ${campaign.release_date}` : ''}
Campaign phase: ${task.phase}
Task: ${task.title}
Task description: ${task.description ?? 'No description'}

Output 3-5 numbered steps. Each step is one sentence, max 15 words. Direct, imperative, specific to this artist.
Format exactly like:
1. Do this first specific thing
2. Then do this next thing
3. Then this
No intro. No outro. No headers. Numbers only.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Write the execution brief for: ${task.title}` }],
  })

  const block = response.content[0]
  if (!block || block.type !== 'text') throw new Error('Unexpected response')
  const brief = block.text.trim()

  await supabase
    .from('campaign_tasks')
    .update({ ai_context: brief })
    .eq('id', taskId)
    .eq('user_id', user.id)

  return brief
}
