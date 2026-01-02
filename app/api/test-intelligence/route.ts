// app/api/test-intelligence/route.ts
// Test endpoint for intelligence layer
// DELETE THIS FILE after verification

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCurrentRead } from '@/lib/intelligence'
import { getCachedInterpretation, cacheInterpretation } from '@/lib/intelligence'

export async function GET() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json({ 
      error: 'Not authenticated. Log in first.' 
    }, { status: 401 })
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ 
      error: 'Profile not found' 
    }, { status: 404 })
  }

  try {
    // Check cache first
    const cached = await getCachedInterpretation(user.id, profile)
    
    if (cached) {
      return NextResponse.json({
        status: 'success',
        source: 'cache',
        currentRead: cached.current_read,
        metadata: {
          generatedAt: cached.generated_at,
          ageInDays: ((Date.now() - new Date(cached.generated_at).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1),
          cost: `$${cached.cost_usd}`,
          tokens: {
            input: cached.input_tokens,
            output: cached.output_tokens,
          },
        },
        message: 'Using cached interpretation (no API call)',
      })
    }

    // Generate new interpretation
    console.log('[Test] Generating new interpretation for user:', user.email)
    const result = await generateCurrentRead(profile)

    // Cache it
    await cacheInterpretation(user.id, profile, result)

    return NextResponse.json({
      status: 'success',
      source: 'generated',
      currentRead: result.currentRead,
      metadata: {
        valid: result.valid,
        cost: `$${result.cost.toFixed(4)}`,
        tokens: {
          input: result.usage.inputTokens,
          output: result.usage.outputTokens,
        },
      },
      message: 'Generated new interpretation (cached for future requests)',
    })
  } catch (error) {
    console.error('[Test] Intelligence error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to generate interpretation', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
