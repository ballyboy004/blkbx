import Anthropic from '@anthropic-ai/sdk'
import type { AssetGeneratorInput } from './asset-input'

export async function generateCaptionsContent(
  input: AssetGeneratorInput
): Promise<string> {
  const artistName = input.artistName || input.artistContext || 'Independent artist'
  const releaseDateFormatted = input.releaseDate
    ? new Date(input.releaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'not set'

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  const client = new Anthropic({ apiKey })

  const systemPrompt = `You are writing social media captions for an independent artist's music release.
Format your response as labeled blocks exactly like this:

INSTAGRAM
[caption text]

TIKTOK
[caption text]

X
[caption text]

No hashtag spam. No generic hype. Each caption must feel intentional and on-brand.
Match the tone rules exactly — they define this artist's voice.

TONE RULES (follow exactly):
${input.toneRules.map((r) => `- ${r}`).join('\n')}

Respond with only the labeled captions. No explanation, no preamble.`

  const userPrompt = `ARTIST:
- Name: ${artistName}
- Context: ${input.artistContext || 'not provided'}
- Genre/sound: ${input.genreSound || 'not provided'}
- Archetype: ${input.artistArchetype || 'not specified'}
- Visibility style: ${input.visibilityStyle || 'not specified'}
- Audience relationship: ${input.audienceRelationship || 'not specified'}
- Reference artists: ${input.referenceArtists || 'not provided'}

RELEASE:
- Title: ${input.campaignTitle}
- Type: ${input.releaseType || 'not specified'}
- Date: ${releaseDateFormatted}

Write the captions.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const block = response.content?.[0]
  if (block?.type !== 'text' || typeof block.text !== 'string') {
    throw new Error('Unexpected API response: missing text block')
  }
  return block.text.trim()
}
