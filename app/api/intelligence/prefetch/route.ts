import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileByUserId } from '@/lib/profile/profile'
import { generatePrefetchedTask } from '@/lib/intelligence/prefetch'

/**
 * API Route: POST /api/intelligence/prefetch
 * 
 * Triggers background generation of next task.
 * Called by TodayCard when user views current task.
 * Fire-and-forget - doesn't wait for completion.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const profile = await getProfileByUserId(user.id)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Start generation in background (don't await)
    generatePrefetchedTask(user.id, profile).catch(err => {
      console.error('[Prefetch API] Background generation failed:', err)
    })

    // Return immediately - don't wait for generation
    return NextResponse.json({ 
      success: true, 
      message: 'Prefetch started' 
    })
  } catch (error) {
    console.error('[Prefetch API] Error:', error)
    return NextResponse.json({ error: 'Failed to start prefetch' }, { status: 500 })
  }
}
