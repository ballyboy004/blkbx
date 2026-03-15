import { type SupabaseClient } from '@supabase/supabase-js'
import type { Campaign, ContentPiece, CreateCampaignInput, ContentPieceType, CampaignTask, CampaignTaskPhase } from './types'

export async function insertCampaign(
  supabase: SupabaseClient,
  userId: string,
  data: CreateCampaignInput
): Promise<Campaign> {
  const { data: row, error } = await supabase
    .from('campaigns')
    .insert({
      user_id: userId,
      title: data.title.trim(),
      release_type: data.release_type || null,
      release_date: data.release_date || null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error
  if (!row) throw new Error('Failed to create campaign')
  return row as Campaign
}

export async function insertContentPiece(
  supabase: SupabaseClient,
  data: {
    userId: string
    campaignId: string
    type: ContentPieceType
    content: string
  }
): Promise<ContentPiece> {
  const { data: row, error } = await supabase
    .from('content_pieces')
    .insert({
      user_id: data.userId,
      campaign_id: data.campaignId,
      type: data.type,
      content: data.content,
      status: 'generated',
      version: 1,
    })
    .select()
    .single()

  if (error) throw error
  if (!row) throw new Error('Failed to insert content piece')
  return row as ContentPiece
}

export async function insertCampaignTasks(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  tasks: Array<{
    title: string
    description: string
    phase: CampaignTaskPhase
    order_index: number
  }>
): Promise<CampaignTask[]> {
  const rows = tasks.map((task) => ({
    campaign_id: campaignId,
    user_id: userId,
    title: task.title,
    description: task.description,
    phase: task.phase,
    order_index: task.order_index,
    status: 'pending',
  }))

  const { data, error } = await supabase
    .from('campaign_tasks')
    .insert(rows)
    .select()

  if (error) throw error
  if (!data) throw new Error('Failed to insert campaign tasks')
  return data as CampaignTask[]
}
