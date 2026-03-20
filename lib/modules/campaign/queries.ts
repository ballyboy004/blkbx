import { type SupabaseClient } from '@supabase/supabase-js'
import type { Campaign, ContentPiece, CampaignTask } from './types'

export async function getCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string
): Promise<Campaign | null> {
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .maybeSingle()
  return data as Campaign | null
}

export async function getStrategyForCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string
): Promise<ContentPiece | null> {
  const { data } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('type', 'strategy')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as ContentPiece | null
}

export async function getCampaignTasks(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string
): Promise<CampaignTask[]> {
  const { data } = await supabase
    .from('campaign_tasks')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .order('phase', { ascending: true })
    .order('order_index', { ascending: true })
  return (data ?? []) as CampaignTask[]
}

export async function getCampaignContext(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string
): Promise<{ tasks: CampaignTask[]; strategy: ContentPiece | null }> {
  const [tasks, strategy] = await Promise.all([
    getCampaignTasks(supabase, campaignId, userId),
    getStrategyForCampaign(supabase, campaignId, userId),
  ])
  return { tasks, strategy }
}

export async function getActiveCampaign(
  supabase: SupabaseClient,
  userId: string
): Promise<Campaign | null> {
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as Campaign | null
}

export async function getPendingAssets(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string
): Promise<ContentPiece[]> {
  const { data } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('status', 'generated')
    .neq('type', 'strategy')
    .order('created_at', { ascending: true })
  return (data ?? []) as ContentPiece[]
}

export async function getContentPiece(
  supabase: SupabaseClient,
  pieceId: string,
  userId: string
): Promise<ContentPiece | null> {
  const { data } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('id', pieceId)
    .eq('user_id', userId)
    .maybeSingle()
  return data as ContentPiece | null
}
