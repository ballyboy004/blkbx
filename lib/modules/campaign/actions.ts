'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfileByUserId } from '@/lib/profile/profile'
import type { Campaign, ContentPiece, CreateCampaignInput, CampaignStrategyInput, CampaignReleaseType, CampaignTask } from './types'
import { getCampaign } from './queries'
import { insertCampaign, insertContentPiece, insertCampaignTasks, insertSingleCampaignTask, updateCampaignTaskStatus, upsertIntelligenceContext, normalizeTaskType } from './mutations'
import { resolveAssetStrategy } from './intelligence'
import { generateStrategyContent } from './generate/strategy'
import { generateTasksContent, type CampaignTaskGeneratorInput, type GeneratedMilestone } from './generate/tasks'
import type { AssetGeneratorInput } from './generate/asset-input'
import { generateAnnouncementContent } from './generate/announcement'
import { generateCaptionsContent } from './generate/captions'
import { generateEmailContent } from './generate/email'
import { generatePressReleaseContent } from './generate/press-release'

export async function createCampaign(
  formData: CreateCampaignInput
): Promise<{ id: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const campaign = await insertCampaign(supabase, user.id, formData)
  return { id: campaign.id }
}

export async function generateStrategy(campaignId: string): Promise<ContentPiece> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const campaign = await getCampaign(supabase, campaignId, user.id)
  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('artist_name, context, genre_sound, career_stage, constraints')
    .eq('id', user.id)
    .maybeSingle()

  const input: CampaignStrategyInput = {
    artistContext: profile?.artist_name ?? profile?.context ?? 'Independent artist',
    genreSound: profile?.genre_sound ?? '',
    careerStage: profile?.career_stage ?? '',
    constraints: profile?.constraints ?? '',
    campaignTitle: campaign.title,
    releaseType: (campaign.release_type as CampaignReleaseType) ?? null,
    releaseDate: campaign.release_date ?? null,
  }

  const strategyData = await generateStrategyContent(input)
  const content = JSON.stringify(strategyData)

  const piece = await insertContentPiece(supabase, {
    userId: user.id,
    campaignId,
    type: 'strategy',
    content,
  })

  return piece
}

export async function generateCampaignTasks(campaignId: string): Promise<CampaignTask[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const campaign = await getCampaign(supabase, campaignId, user.id)
  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const profile = await getProfileByUserId(user.id)
  if (!profile) {
    throw new Error('Profile not found')
  }

  const goals = Array.isArray(profile.campaign_goals) ? profile.campaign_goals : null
  const readinessChecklist = Array.isArray(profile.readiness_checklist) ? profile.readiness_checklist : []

  // Fetch behavioral context
  const { data: intelligenceCtx } = await supabase
    .from('intelligence_context')
    .select('skip_patterns')
    .eq('user_id', user.id)
    .maybeSingle()

  const skipPatterns = (intelligenceCtx?.skip_patterns as Record<string, number> | null) ?? null

  const input: CampaignTaskGeneratorInput = {
    artistName: (profile as typeof profile & { artist_name?: string }).artist_name ?? profile.context ?? 'Independent artist',
    artistContext: profile.context ?? '',
    genreSound: profile.genre_sound ?? '',
    careerStage: profile.career_stage ?? '',
    constraints: profile.constraints ?? '',
    goals,
    readinessChecklist,
    campaignTitle: campaign.title,
    releaseType: campaign.release_type ?? null,
    releaseDate: campaign.release_date ?? null,
    skipPatterns,
  }

  const milestones: GeneratedMilestone[] = await generateTasksContent(input)

  const insertedTasks: CampaignTask[] = []

  for (const milestone of milestones) {
    const milestoneRow = await insertSingleCampaignTask(supabase, user.id, campaignId, {
      title: milestone.title,
      description: milestone.description,
      phase: milestone.phase,
      order_index: milestone.order_index,
      parent_id: null,
    })

    insertedTasks.push(milestoneRow)

    for (const sub of milestone.sub_tasks) {
      const subTaskRow = await insertSingleCampaignTask(supabase, user.id, campaignId, {
        title: sub.title,
        description: sub.description,
        phase: milestone.phase,
        order_index: sub.order_index,
        parent_id: milestoneRow.id,
      })

      insertedTasks.push(subTaskRow)
    }
  }

  return insertedTasks
}

export async function generateAssets(campaignId: string): Promise<ContentPiece[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const campaign = await getCampaign(supabase, campaignId, user.id)
  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const profile = await getProfileByUserId(user.id)
  if (!profile) {
    throw new Error('Profile not found')
  }

  const assetStrategy = resolveAssetStrategy(profile)
  if (!assetStrategy.shouldGenerate) {
    return []
  }

  const profileWithArtistName = profile as typeof profile & { artist_name?: string }
  const input: AssetGeneratorInput = {
    artistName: profileWithArtistName.artist_name ?? profile.context ?? 'Independent artist',
    artistContext: profile.context ?? '',
    genreSound: profile.genre_sound ?? '',
    careerStage: profile.career_stage ?? '',
    artistArchetype: profile.artist_archetype ?? null,
    visibilityStyle: profile.visibility_style ?? null,
    releasePhilosophy: profile.release_philosophy ?? null,
    audienceRelationship: profile.audience_relationship ?? null,
    referenceArtists: profile.reference_artists ?? null,
    constraints: profile.constraints ?? '',
    campaignTitle: campaign.title,
    releaseType: campaign.release_type ?? null,
    releaseDate: campaign.release_date ?? null,
    toneRules: assetStrategy.toneRules,
  }

  const generateForType = async (type: typeof assetStrategy.assets[number]): Promise<ContentPiece | null> => {
    let content: string
    if (type === 'announcement') {
      content = await generateAnnouncementContent(input)
    } else if (type === 'captions') {
      content = await generateCaptionsContent(input)
    } else if (type === 'email') {
      content = await generateEmailContent(input)
    } else if (type === 'press_release') {
      content = await generatePressReleaseContent(input)
    } else {
      return null
    }
    return insertContentPiece(supabase, { userId: user.id, campaignId, type, content })
  }

  const results = (await Promise.all(assetStrategy.assets.map(generateForType)))
    .filter((p): p is ContentPiece => p !== null)

  return results
}

export async function checkAdaptiveTrigger(
  campaignId: string
): Promise<{ triggerType: string; skipCount: number } | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')

  const { data: skippedTasks } = await supabase
    .from('campaign_tasks')
    .select('title')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .eq('status', 'skipped')
    .not('parent_id', 'is', null)

  if (!skippedTasks || skippedTasks.length === 0) return null

  const counts: Record<string, number> = {}
  for (const task of skippedTasks) {
    const type = normalizeTaskType(task.title)
    counts[type] = (counts[type] ?? 0) + 1
  }

  const [topType, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? []
  if (!topType || topCount < 3) return null
  return { triggerType: topType, skipCount: topCount }
}

export async function replanCampaign(campaignId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')

  const campaign = await getCampaign(supabase, campaignId, user.id)
  if (!campaign) throw new Error('Campaign not found')

  const profile = await getProfileByUserId(user.id)
  if (!profile) throw new Error('Profile not found')

  // Delete all pending sub-tasks only — never touch done/skipped
  await supabase
    .from('campaign_tasks')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .not('parent_id', 'is', null)

  // Delete orphaned milestones that now have no sub-tasks
  const { data: remainingSubTasks } = await supabase
    .from('campaign_tasks')
    .select('parent_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .not('parent_id', 'is', null)

  const activeParentIds = new Set((remainingSubTasks ?? []).map(t => t.parent_id))

  const { data: allMilestones } = await supabase
    .from('campaign_tasks')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .is('parent_id', null)

  const orphanedMilestoneIds = (allMilestones ?? [])
    .filter(m => !activeParentIds.has(m.id))
    .map(m => m.id)

  if (orphanedMilestoneIds.length > 0) {
    await supabase
      .from('campaign_tasks')
      .delete()
      .in('id', orphanedMilestoneIds)
  }

  // Fetch skip patterns for injection
  const { data: intelligenceCtx } = await supabase
    .from('intelligence_context')
    .select('skip_patterns')
    .eq('user_id', user.id)
    .maybeSingle()

  const skipPatterns = (intelligenceCtx?.skip_patterns as Record<string, number> | null) ?? null

  const goals = Array.isArray(profile.campaign_goals) ? profile.campaign_goals : null
  const readinessChecklist = Array.isArray(profile.readiness_checklist) ? profile.readiness_checklist : []

  const input: CampaignTaskGeneratorInput = {
    artistName: (profile as any).artist_name ?? profile.context ?? 'Independent artist',
    artistContext: profile.context ?? '',
    genreSound: profile.genre_sound ?? '',
    careerStage: profile.career_stage ?? '',
    constraints: profile.constraints ?? '',
    goals,
    readinessChecklist,
    campaignTitle: campaign.title,
    releaseType: campaign.release_type ?? null,
    releaseDate: campaign.release_date ?? null,
    skipPatterns,
  }

  const milestones = await generateTasksContent(input)

  for (const milestone of milestones) {
    const milestoneRow = await insertSingleCampaignTask(supabase, user.id, campaignId, {
      title: milestone.title,
      description: milestone.description,
      phase: milestone.phase,
      order_index: milestone.order_index,
      parent_id: null,
    })
    for (const sub of milestone.sub_tasks) {
      await insertSingleCampaignTask(supabase, user.id, campaignId, {
        title: sub.title,
        description: sub.description,
        phase: milestone.phase,
        order_index: sub.order_index,
        parent_id: milestoneRow.id,
      })
    }
  }
}

export async function completeTask(
  taskId: string,
  taskTitle: string,
  status: 'done' | 'skipped',
  campaignId: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  await updateCampaignTaskStatus(supabase, taskId, user.id, status)

  upsertIntelligenceContext(supabase, user.id, taskTitle, status).catch(() => {
    // Silently fail — intelligence is non-critical
  })

  if (status === 'skipped') {
    checkAdaptiveTrigger(campaignId).then(async (trigger) => {
      if (trigger) {
        await replanCampaign(campaignId).catch(() => {})
      }
    }).catch(() => {})
  }
}
