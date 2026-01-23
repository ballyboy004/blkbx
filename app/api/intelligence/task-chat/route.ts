// app/api/intelligence/task-chat/route.ts
// Task contextual chat API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileByUserId } from '@/lib/profile/profile'

export async function POST(request: NextRequest) {
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

    const { taskTitle, taskDetails, userMessage, chatHistory } = await request.json()

    if (!taskTitle || !userMessage?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For now, return a simple helpful response
    // TODO: Implement full task chat with Claude
    const response = `For "${taskTitle}": ${userMessage.trim().length > 50 ? 'That\'s a great question. Focus on starting small and iterating.' : 'Try breaking it down into smaller steps and tackling the first one.'}`

    return NextResponse.json({
      success: true,
      response,
      shouldUpdateTask: false,
      updatedTask: null
    })

  } catch (error) {
    console.error('[Task Chat API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate chat response' },
      { status: 500 }
    )
  }
}
