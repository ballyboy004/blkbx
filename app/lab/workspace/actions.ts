'use server'

import Anthropic from '@anthropic-ai/sdk'

export type ConsoleMessage = {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are BLACKBOX — an intelligent career operating system for independent artists.

Active campaign context:
- Campaign: Music
- Phase: Phase 1 — Preparation
- Current task: Finalize 8–10 trap instrumentals
- Progress: 1 of 6 tasks complete

RESPONSE RULES — follow these strictly:
- Never write paragraphs. Never explain in prose.
- Always respond with short labeled blocks.
- Use this format when showing structure:

  LABEL
  Short value or 1-line statement.

- For lists, use one item per line with a dash prefix.
- Maximum 4–6 lines per response.
- If showing phases or steps, show them as a short vertical sequence.
- Bold key terms using **term** syntax.
- Never use more than 2 blank lines.
- Sound like a system that already knows the answer, not one explaining itself.`

export async function askBlackbox(
  messages: ConsoleMessage[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}
