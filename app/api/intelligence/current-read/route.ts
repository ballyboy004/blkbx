// app/api/intelligence/current-read/route.ts
// Fast refresh for ONLY Current Read text (2-3 seconds vs 15 seconds)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithClaude } from '@/lib/intelligence/claude'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    // Minimal prompt for ONLY Current Read - fast generation
    const prompt = `Based on this artist profile, generate ONLY a "Current Read" - a 1-2 sentence strategic observation about where they are right now and what phase they're in.

Profile:
- Context: ${profile.context || 'Independent artist'}
- Goal: ${profile.primary_goal || 'Growing career'}
- Stage: ${profile.career_stage || 'building'}
- Focus: ${profile.current_focus || 'next steps'}
- Strengths: ${profile.strengths || 'Creative consistency'}
- Friction: ${profile.weaknesses || 'Resource constraints'}
- Constraints: ${profile.constraints || 'Limited time/budget'}

Respond with ONLY the Current Read text. No JSON, no formatting, no preamble. Just the strategic observation.`

    // Generate just the Current Read (fast, minimal tokens)
    const { text: currentRead } = await generateWithClaude(prompt, {
      maxTokens: 100,
      temperature: 0.7,
    })

    const cleanCurrentRead = currentRead.trim()

    // Update ONLY the current_read field in existing cache
    const { error: updateError } = await supabase
      .from('interpretations')
      .update({ 
        current_read: cleanCurrentRead,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[Current Read] Error updating cache:', updateError)
      return NextResponse.json({ success: false, error: 'Failed to update cache' }, { status: 500 })
    }

    console.log('[Current Read] Successfully refreshed for user:', user.id)

    return NextResponse.json({ 
      success: true, 
      currentRead: cleanCurrentRead 
    })

  } catch (error) {
    console.error('[Current Read API] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to refresh current read' 
    }, { status: 500 })
  }
}
