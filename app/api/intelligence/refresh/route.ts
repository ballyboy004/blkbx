import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileByUserId } from '@/lib/profile/profile'
import { getCompleteDashboardIntelligence } from '@/lib/dashboard/intelligence'

/**
 * API Route: GET /api/intelligence/refresh
 * 
 * Regenerates dashboard intelligence and returns the new task.
 * Used by TodayCard to refresh without full page reload.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get profile
    const profile = await getProfileByUserId(user.id)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Generate fresh intelligence
    const intelligence = await getCompleteDashboardIntelligence(user.id, profile)

    return NextResponse.json({
      success: true,
      task: intelligence.priorityTask,
      currentRead: intelligence.currentRead,
      nextActions: intelligence.nextActions,
      source: intelligence.source,
    })
  } catch (error) {
    console.error('[API Intelligence Refresh] Error:', error)
    return NextResponse.json({ error: 'Failed to refresh intelligence' }, { status: 500 })
  }
}
