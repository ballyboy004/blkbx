'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileUpdateData = {
  context?: string
  primary_goal?: string
  genre_sound?: string
  career_stage?: string
  strengths?: string
  weaknesses?: string
  constraints?: string
  current_focus?: string
  // NEW fields for task routing
  content_activity?: string
  release_status?: string
  stuck_on?: string
}

/**
 * Server Action: Update user profile
 * 
 * Updates profile fields and clears intelligence cache
 * (since profile hash will change, forcing regeneration)
 */
export async function updateProfile(
  data: ProfileUpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Profile Update] Error:', updateError)
      return { success: false, error: 'Failed to update profile' }
    }

    console.log('[Profile Update] Success for user:', user.id)

    // Delete cached interpretation (profile changed, so it's stale)
    const { error: cacheError } = await supabase
      .from('interpretations')
      .delete()
      .eq('user_id', user.id)

    if (cacheError) {
      console.warn('[Profile Update] Cache clear warning:', cacheError)
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('[Profile Update] Unexpected error:', error)
    return { success: false, error: 'Unexpected error' }
  }
}
