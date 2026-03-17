import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const body = await req.json()
  const {
    role,
    genreSound,
    projectStatus,
    readinessChecklist,
    campaignGoals,
    primaryBlocker,
    constraints,
  } = body

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ interpretation: '' }, { status: 500 })

  const client = new Anthropic({ apiKey })

  const systemPrompt = `You are BLACKBOX — a career intelligence system for independent artists and producers.
You just read a new user's onboarding answers. Write a 3-sentence read of their situation.

What makes a great read:
- It names the specific tension in their situation (e.g. "you have a finished record but no audience infrastructure", "your sound is playlist-ready but you're operating like you're not")
- It references their actual genre/sound and real constraints — not generic artist problems
- It ends with the single most important leverage point BLACKBOX will attack first
- It reads like a sharp collaborator who actually listened, not a chatbot summarizing inputs

Format: 3 sentences, each on its own line separated by a blank line.
Tone: direct, lowercase, no hype, no filler, no questions. under 20 words per sentence.
Never say "blackbox will". Say "we're starting with" or "the move is" or "that means".`

  const userPrompt = `User profile:
- Role: ${role}
- Sound/genre: ${genreSound || 'not specified'}
- Project status: ${projectStatus || 'not specified'}
- Already done: ${Array.isArray(readinessChecklist) ? readinessChecklist.join(', ') : readinessChecklist || 'nothing checked'}
- Goals: ${Array.isArray(campaignGoals) ? campaignGoals.join(', ') : campaignGoals || 'not specified'}
- Biggest blocker: ${primaryBlocker || 'not specified'}
- Constraints: ${Array.isArray(constraints) ? constraints.join(', ') : constraints || 'none specified'}

Write the 2-3 sentence interpretation.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const block = response.content[0]
  const text = block.type === 'text' ? block.text.trim() : ''

  return NextResponse.json({ interpretation: text })
}
