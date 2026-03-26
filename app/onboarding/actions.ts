'use server'

import { createClient } from '@/lib/supabase/server'
import { insertCampaign } from '@/lib/modules/campaign/mutations'

export async function createCampaignFromProfile(): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Read profile to build a smarter campaign title
  const { data: profile } = await supabase
    .from('profiles')
    .select('genre_sound, context, role, campaign_goals')
    .eq('id', user.id)
    .maybeSingle()

  const isProducer = profile?.role === 'producer'

  // Build title from what we know about the artist
  let title = 'New Campaign'
  if (isProducer) {
    const goals = Array.isArray(profile?.campaign_goals) ? profile.campaign_goals : []
    const focus = goals[0] ?? profile?.genre_sound ?? null
    title = focus ? `${focus} — placement push` : 'placement push'
  } else if (profile?.genre_sound) {
    title = `${profile.genre_sound} — new release`
  } else if (profile?.context) {
    const snippet = profile.context.slice(0, 40).trim()
    title = snippet.length > 0 ? `${snippet}...` : title
  }

  const campaign = await insertCampaign(supabase, user.id, {
    title,
    release_type: null,
    release_date: null,
  })
  return { id: campaign.id }
}
