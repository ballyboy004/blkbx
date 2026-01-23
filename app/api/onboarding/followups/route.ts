import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { context, genre } = await request.json()

    if (!context || context.trim().length < 20) {
      return NextResponse.json({ questions: [] })
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are the intelligence layer for BLACKBOX, a career system for independent artists.

An artist just completed the first part of onboarding. Your job is to generate 2-3 follow-up questions that will help BLACKBOX better understand their situation and serve them more effectively.

ARTIST'S "ABOUT YOU" RESPONSE:
"${context}"

ARTIST'S GENRE (already captured separately):
"${genre || 'not provided'}"

FIELDS ALREADY CAPTURED OR COMING LATER (DO NOT ASK ABOUT THESE):
- Genre/sound (already have it)
- Career stage (already have it)
- Primary goal / 90-day target (asked in next step)
- Current focus / 30-day priority (asked in next step)
- Current state relative to goal (asked in next step)
- Strengths (asked in next step)
- Weaknesses (asked in next step)
- Constraints like time/money/energy (asked in next step)

WHAT TO ASK ABOUT (things that help BLACKBOX personalize):
- Current metrics: monthly listeners, followers, engagement rates (specific numbers help)
- Release history: how many tracks out, when was last release
- Posting frequency: how often they actually post (not how often they want to)
- What's working: what content/approach has gotten traction
- What's not working: what they've tried that flopped
- Team situation: solo or do they have help (manager, producer, etc)
- Revenue: are they monetizing yet, how

RULES:
- Questions must be SHORT (under 12 words)
- Questions must extract SPECIFIC, ACTIONABLE information
- NO fluffy/philosophical questions
- NO questions about things they clearly already stated
- NO obvious questions (like "do you use analytics" - of course they do)
- Make questions feel like a smart peer asking, not a form
- Lowercase, casual tone

Return ONLY a JSON array of 2-3 question strings. Nothing else.

Example good questions:
["what are your current monthly listeners?", "when did you last release a track?", "are you doing this solo or do you have help?"]

Example bad questions:
["what kind of music resonates with your audience?" (too vague), "how do you feel about your progress?" (fluffy), "what's your genre?" (already captured)]`
        }
      ],
    })

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : ''

    let questions: string[] = []
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('[Followups] JSON parse error:', parseError)
      questions = []
    }

    questions = questions.slice(0, 3)

    console.log('[Followups] Generated questions:', questions)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('[Followups] Error:', error)
    return NextResponse.json({ questions: [] })
  }
}
