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
    parent_id: string | null
  }>
): Promise<CampaignTask[]> {
  const rows = tasks.map((task) => ({
    campaign_id: campaignId,
    user_id: userId,
    title: task.title,
    description: task.description,
    phase: task.phase,
    order_index: task.order_index,
    parent_id: task.parent_id ?? null,
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

export async function insertSingleCampaignTask(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  task: {
    title: string
    description: string
    phase: CampaignTaskPhase
    order_index: number
    parent_id: string | null
    due_date?: string | null
  }
): Promise<CampaignTask> {
  const { data, error } = await supabase
    .from('campaign_tasks')
    .insert({
      campaign_id: campaignId,
      user_id: userId,
      title: task.title,
      description: task.description,
      phase: task.phase,
      order_index: task.order_index,
      parent_id: task.parent_id ?? null,
      due_date: task.due_date ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to insert campaign task')
  return data as CampaignTask
}

export async function updateContentPieceStatus(
  supabase: SupabaseClient,
  pieceId: string,
  userId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('content_pieces')
    .update({ status })
    .eq('id', pieceId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function updateContentPieceContent(
  supabase: SupabaseClient,
  pieceId: string,
  userId: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('content_pieces')
    .update({ content })
    .eq('id', pieceId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function updateCampaignTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  status: 'done' | 'skipped',
): Promise<void> {
  const { error } = await supabase
    .from('campaign_tasks')
    .update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function upsertIntelligenceContext(
  supabase: SupabaseClient,
  userId: string,
  taskTitle: string,
  status: 'done' | 'skipped',
  taskCreatedAt?: string | null,
  hasDeliverable?: boolean,
): Promise<void> {
  const { data: existing } = await supabase
    .from('intelligence_context')
    .select('skip_patterns, preferred_task_types, execution_signals')
    .eq('user_id', userId)
    .maybeSingle()

  const skipPatterns = (existing?.skip_patterns as Record<string, number>) ?? {}
  const preferredTypes = (existing?.preferred_task_types as Record<string, number>) ?? {}
  const taskType = normalizeTaskType(taskTitle)

  if (status === 'skipped') {
    skipPatterns[taskType] = (skipPatterns[taskType] ?? 0) + 1
  } else {
    preferredTypes[taskType] = (preferredTypes[taskType] ?? 0) + 1
  }

  const totalDone = Object.values(preferredTypes).reduce((a, b) => a + b, 0)
  const totalSkipped = Object.values(skipPatterns).reduce((a, b) => a + b, 0)
  const total = totalDone + totalSkipped
  const completionRate = total > 0 ? totalDone / total : 0

  const existingSignals = ((existing as any)?.execution_signals as Record<string, any>) ?? {}

  if (status === 'done' && taskCreatedAt) {
    const createdMs = new Date(taskCreatedAt).getTime()
    const completedMs = Date.now()
    const hoursToComplete = Math.round((completedMs - createdMs) / (1000 * 60 * 60))

    const timeByType = (existingSignals.time_to_complete_by_type as Record<string, number[]>) ?? {}
    if (!timeByType[taskType]) timeByType[taskType] = []
    timeByType[taskType].push(hoursToComplete)
    if (timeByType[taskType].length > 10) timeByType[taskType].shift()
    existingSignals.time_to_complete_by_type = timeByType
  }

  if (status === 'done') {
    const deliverableStats = (existingSignals.deliverable_stats as { done: number; with_deliverable: number }) ?? { done: 0, with_deliverable: 0 }
    deliverableStats.done += 1
    if (hasDeliverable) deliverableStats.with_deliverable += 1
    existingSignals.deliverable_stats = deliverableStats
    existingSignals.deliverable_rate = deliverableStats.done > 0
      ? Math.round((deliverableStats.with_deliverable / deliverableStats.done) * 100) / 100
      : 0
  }

  if (status === 'skipped') {
    const stallPatterns = (existingSignals.stall_patterns as Record<string, number>) ?? {}
    stallPatterns[taskType] = (stallPatterns[taskType] ?? 0) + 1
    existingSignals.stall_patterns = stallPatterns
  }

  await supabase.from('intelligence_context').upsert({
    user_id: userId,
    skip_patterns: skipPatterns,
    preferred_task_types: preferredTypes,
    completion_rate: completionRate,
    execution_signals: existingSignals,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export async function saveDeliverableNote(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  note: string
): Promise<void> {
  const { error } = await supabase
    .from('campaign_tasks')
    .update({ deliverable_note: note.trim() })
    .eq('id', taskId)
    .eq('user_id', userId)
  if (error) throw error
}

export function normalizeTaskType(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('tiktok') || lower.includes('reel')) return 'short_video'
  if (lower.includes('instagram') && lower.includes('post')) return 'instagram_post'
  if (lower.includes('instagram') && lower.includes('story')) return 'instagram_story'
  if (lower.includes('twitter') || lower.includes(' x ') || lower.includes('tweet')) return 'twitter_x'
  if (lower.includes('email') || lower.includes('newsletter')) return 'email'
  if (lower.includes('playlist') || lower.includes('curator')) return 'playlist_pitch'
  if (lower.includes('spotify') && lower.includes('editorial')) return 'spotify_editorial'
  if (lower.includes('press') || lower.includes('blog') || lower.includes('journalist')) return 'press_outreach'
  if (lower.includes('youtube')) return 'youtube'
  if (lower.includes('distributor') || lower.includes('distrokid') || lower.includes('tunecore')) return 'distribution'
  if (lower.includes('pre-save') || lower.includes('presave')) return 'presave'
  if (lower.includes('bio') || lower.includes('profile')) return 'profile_update'
  if (lower.includes('dm') || lower.includes('message') || lower.includes('reach out')) return 'direct_outreach'
  return 'general'
}
