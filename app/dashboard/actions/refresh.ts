'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action: Refresh dashboard intelligence
 * 
 * Deletes cached interpretation to force regeneration on next load.
 * Called by FRESH button.
 */
export async function refreshIntelligence(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Delete cached interpretation to force regeneration
    const { error: deleteError } = await supabase
      .from('interpretations')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[FRESH] Error deleting cache:', deleteError)
      return { success: false, error: 'Failed to clear cache' }
    }

    console.log('[FRESH] Cache cleared for user:', user.id)

    // Revalidate the dashboard page to trigger fresh data fetch
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('[FRESH] Unexpected error:', error)
    return { success: false, error: 'Unexpected error' }
  }
}
