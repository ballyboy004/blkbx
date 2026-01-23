// app/api/intelligence/strategic-task/route.ts
// Strategic Task Generation with User Input

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithClaude, calculateCost } from '@/lib/intelligence/claude'
import { buildStrategicTaskPrompt } from '@/lib/intelligence/prompts'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Parse request body
    const { strategicInput, strategicQuestion } = await request.json()
    
    if (!strategicInput || strategicInput.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Strategic input is required' 
      }, { status: 400 })
    }

    console.log('[Strategic Task] Generating task for user:', user.id, {
      inputLength: strategicInput.length,
      question: strategicQuestion?.substring(0, 50) + '...'
    })

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 })
    }

    // Build strategic task prompt with user input
    const prompt = buildStrategicTaskPrompt(
      profile, 
      strategicInput,
      strategicQuestion
    )

    // Generate aligned task with Claude
    const { text, usage } = await generateWithClaude(prompt, {
      maxTokens: 800,
      temperature: 0.7,
    })

    // Parse the response
    let taskData
    try {
      const cleanedText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
      taskData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('[Strategic Task] Parse error:', parseError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to parse task response' 
      }, { status: 500 })
    }

    // Validate task structure
    if (!taskData.title || !taskData.reasoning || !taskData.guide) {
      console.error('[Strategic Task] Invalid task structure:', taskData)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid task structure generated' 
      }, { status: 500 })
    }

    const cost = calculateCost(usage)

    // Cache the strategic task (update interpretations table)
    const { error: cacheError } = await supabase
      .from('interpretations')
      .update({ 
        priority_task_title: taskData.title,
        priority_task_reasoning: taskData.reasoning,
        priority_task_guardrail: taskData.guardrail,
        priority_task_guide: taskData.guide,
        updated_at: new Date().toISOString(),
        // Store the strategic input for learning
        strategic_input_used: strategicInput,
        strategic_question_used: strategicQuestion
      })
      .eq('user_id', user.id)

    if (cacheError) {
      console.warn('[Strategic Task] Cache update failed:', cacheError)
      // Don't fail the request - just warn
    }

    // Log the strategic task generation
    console.log('[Strategic Task] Generated successfully', {
      userId: user.id,
      taskTitle: taskData.title,
      cost: `$${cost.toFixed(4)}`,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens
    })

    return NextResponse.json({ 
      success: true, 
      task: {
        title: taskData.title,
        reasoning: taskData.reasoning,
        guardrail: taskData.guardrail,
        guide: taskData.guide
      },
      metadata: {
        cost: `$${cost.toFixed(4)}`,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[Strategic Task API] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate strategic task' 
    }, { status: 500 })
  }
}
