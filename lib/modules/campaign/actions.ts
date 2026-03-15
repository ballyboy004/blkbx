'use server'

import { createClient } from '@/lib/supabase/server'
import type { Campaign, ContentPiece, CreateCampaignInput, CampaignStrategyInput, CampaignReleaseType, CampaignTask } from './types'
import { getCampaign } from './queries'
import { insertCampaign, insertContentPiece, insertCampaignTasks } from './mutations'
import { generateStrategyContent } from './generate/strategy'
import { generateTasksContent, type CampaignTaskGeneratorInput } from './generate/tasks'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('artist_name, context, genre_sound, career_stage, strengths, constraints, current_focus')
    .eq('id', user.id)
    .maybeSingle()

  const input: CampaignTaskGeneratorInput = {
    artistName: profile?.artist_name ?? profile?.context ?? 'Independent artist',
    artistContext: profile?.context ?? '',
    genreSound: profile?.genre_sound ?? '',
    careerStage: profile?.career_stage ?? '',
    strengths: profile?.strengths ?? '',
    constraints: profile?.constraints ?? '',
    currentFocus: profile?.current_focus ?? '',
    campaignTitle: campaign.title,
    releaseType: campaign.release_type ?? null,
    releaseDate: campaign.release_date ?? null,
  }

  const tasks = await generateTasksContent(input)
  return insertCampaignTasks(supabase, user.id, campaignId, tasks)
}
