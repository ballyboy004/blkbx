import Anthropic from '@anthropic-ai/sdk'
import type { CampaignStrategyInput, CampaignStrategy } from '../types'

const SYSTEM_PROMPT =
  'You are a music release strategist. Respond ONLY with valid JSON. No markdown, no explanation, no preamble. The JSON must match this exact structure:\n{\n  "analysis": "string — 2-3 sentences summarising the artist situation and what this release needs to achieve",\n  "strategic_pillars": ["string", "string", "string"],\n  "risks": ["string", "string"],\n  "opportunities": ["string", "string"],\n  "immediate_actions": ["string", "string", "string"]\n}\nBe specific to this artist. No generic advice. No hype.'

export async function generateStrategyContent(
  input: CampaignStrategyInput
): Promise<CampaignStrategy> {
  const releaseDateFormatted =
    input.releaseDate != null && input.releaseDate !== ''
      ? new Date(input.releaseDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'not set'

  const userPrompt = `Generate a release strategy for this campaign.

ARTIST / PROFILE:
- Context: ${input.artistContext}
- Genre/sound: ${input.genreSound || 'not provided'}
- Career stage: ${input.careerStage || 'not provided'}
- Constraints: ${input.constraints || 'none specified'}

CAMPAIGN:
- Title: ${input.campaignTitle}
- Release type: ${input.releaseType ?? 'not specified'}
- Target release date: ${releaseDateFormatted}

Output a clear, actionable strategy (a few short paragraphs or bullet points). No hype or filler.`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: userPrompt }],
    system: SYSTEM_PROMPT,
  })

  const firstBlock = response.content?.[0]
  if (firstBlock?.type !== 'text' || typeof firstBlock.text !== 'string') {
    throw new Error('Unexpected API response: missing text block')
  }
  const raw = firstBlock.text.replace(/```json|```/g, '').trim()
  const result = JSON.parse(raw) as Record<string, unknown>
  const required = ['analysis', 'strategic_pillars', 'risks', 'opportunities', 'immediate_actions']
  for (const key of required) {
    if (!(key in result)) {
      throw new Error('Strategy response missing required fields')
    }
  }
  return result as CampaignStrategy
}
