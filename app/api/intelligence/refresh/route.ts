import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileByUserId } from '@/lib/profile/profile'
import { getCompleteDashboardIntelligence } from '@/lib/dashboard/intelligence'
import { getPrefetchedTask, clearPrefetchedTask, isReflectionSubstantive } from '@/lib/intelligence/prefetch'

/**
 * API Route: GET /api/intelligence/refresh
 * 
 * Regenerates dashboard intelligence and returns the new task.
 * Now checks for prefetched task first for instant delivery.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Check for reflection in query params
    const url = new URL(request.url)
    const reflection = url.searchParams.get('reflection') || ''

    // Get profile
    const profile = await getProfileByUserId(user.id)
    
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    // Check for prefetched task
    const prefetch = await getPrefetchedTask(user.id)
    
    if (prefetch && !isReflectionSubstantive(reflection)) {
      // Use prefetched task - instant!
      console.log('[Refresh] Using prefetched task:', prefetch.task.title)
      
      // Clear the prefetch so it's not reused
      await clearPrefetchedTask(user.id)
      
      return NextResponse.json({
        success: true,
        task: {
          title: prefetch.task.title || 'No task available',
          reasoning: prefetch.task.reasoning || 'No reasoning provided',
          guardrail: prefetch.task.guardrail || 'Take your time',
          guide: prefetch.task.guide,
        },
        currentRead: prefetch.currentRead || '',
        nextActions: prefetch.nextActions || [],
        source: 'prefetch',
      })
    }

    // No prefetch or substantive reflection - generate fresh
    console.log('[Refresh] Generating fresh task...', {
      hadPrefetch: !!prefetch,
      substantiveReflection: isReflectionSubstantive(reflection),
    })

    // Clear any stale prefetch
    if (prefetch) {
      await clearPrefetchedTask(user.id)
    }

    // Generate fresh intelligence
    const intelligence = await getCompleteDashboardIntelligence(user.id, profile)

    // Validate task has required fields
    const task = intelligence?.priorityTask
    if (!task || !task.title || !task.reasoning) {
      console.error('[Refresh] Invalid task returned:', task)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate valid task' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      task: {
        title: task.title || 'No task available',
        reasoning: task.reasoning || 'No reasoning provided',
        guardrail: task.guardrail || 'Take your time',
        guide: task.guide,
      },
      currentRead: intelligence.currentRead || '',
      nextActions: intelligence.nextActions || [],
      source: 'fresh',
    })
  } catch (error) {
    console.error('[Refresh] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refresh intelligence' 
    }, { status: 500 })
  }
}
