'use server'

import { createClient } from '@/lib/supabase/server'
import { getContentPiece, getCampaign } from '@/lib/modules/campaign/queries'
import {
  updateContentPieceStatus,
  updateContentPieceContent,
  insertContentPiece,
} from '@/lib/modules/campaign/mutations'
import { getProfileByUserId } from '@/lib/profile/profile'
import { resolveAssetStrategy } from '@/lib/modules/campaign/intelligence'
import type { ContentPiece } from '@/lib/modules/campaign/types'
import type { AssetGeneratorInput } from '@/lib/modules/campaign/generate/asset-input'

export async function approveAsset(
  pieceId: string,
  campaignId: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const piece = await getContentPiece(supabase, pieceId, user.id)
  if (!piece || piece.campaign_id !== campaignId) throw new Error('Asset not found')
  await updateContentPieceStatus(supabase, pieceId, user.id, 'approved')
}

export async function rejectAsset(
  pieceId: string,
  campaignId: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const piece = await getContentPiece(supabase, pieceId, user.id)
  if (!piece || piece.campaign_id !== campaignId) throw new Error('Asset not found')
  await updateContentPieceStatus(supabase, pieceId, user.id, 'rejected')
}

export async function saveEditedAsset(
  pieceId: string,
  content: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  await updateContentPieceContent(supabase, pieceId, user.id, content)
}

export async function regenerateAsset(
  pieceId: string,
  campaignId: string
): Promise<ContentPiece> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const piece = await getContentPiece(supabase, pieceId, user.id)
  if (!piece) throw new Error('Asset not found')

  const campaign = await getCampaign(supabase, campaignId, user.id)
  if (!campaign) throw new Error('Campaign not found')

  const profile = await getProfileByUserId(user.id)
  if (!profile) throw new Error('Profile not found')

  const assetStrategy = resolveAssetStrategy(profile)
  const profileWithName = profile as typeof profile & { artist_name?: string }

  const input: AssetGeneratorInput = {
    artistName: profileWithName.artist_name ?? profile.context ?? 'Independent artist',
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

  let newContent: string

  if (piece.type === 'announcement') {
    const { generateAnnouncementContent } = await import(
      '@/lib/modules/campaign/generate/announcement'
    )
    newContent = await generateAnnouncementContent(input)
  } else if (piece.type === 'captions') {
    const { generateCaptionsContent } = await import(
      '@/lib/modules/campaign/generate/captions'
    )
    newContent = await generateCaptionsContent(input)
  } else if (piece.type === 'email') {
    const { generateEmailContent } = await import(
      '@/lib/modules/campaign/generate/email'
    )
    newContent = await generateEmailContent(input)
  } else if (piece.type === 'press_release') {
    const { generatePressReleaseContent } = await import(
      '@/lib/modules/campaign/generate/press-release'
    )
    newContent = await generatePressReleaseContent(input)
  } else {
    throw new Error('Cannot regenerate this asset type')
  }

  // Mark old piece rejected
  await updateContentPieceStatus(supabase, pieceId, user.id, 'rejected')

  // Insert new piece
  const newPiece = await insertContentPiece(supabase, {
    userId: user.id,
    campaignId,
    type: piece.type,
    content: newContent,
  })

  return newPiece
}
