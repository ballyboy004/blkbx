'use server'

import { createClient } from '@/lib/supabase/server'

export type CreateCampaignData = {
  title: string
  release_type: string
  target_release_date: string
}

/**
 * Server Action: Create a new campaign (draft).
 * Does not set release_id.
 */
export async function createCampaign(
  formData: CreateCampaignData
): Promise<{ id: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      user_id: user.id,
      title: formData.title.trim(),
      release_type: formData.release_type || null,
      release_date: formData.target_release_date || null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Campaign Create] Error:', error)
    throw new Error(error.message)
  }

  if (!data?.id) {
    throw new Error('Failed to create campaign')
  }

  return { id: data.id }
}
