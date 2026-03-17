import Anthropic from '@anthropic-ai/sdk'
import type { AssetGeneratorInput } from './asset-input'

export async function generateAnnouncementContent(
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

  const systemPrompt = `You are writing a release announcement for an independent artist.
This is a single short statement — not a press release, not a caption, not a pitch.
It declares that a release is coming or has arrived.
Maximum 3 sentences. No hashtags. No links. No call-to-action unless tone rules require it.

TONE RULES (follow exactly):
${input.toneRules.map((r) => `- ${r}`).join('\n')}

Respond with only the announcement text. No labels, no explanation, no preamble.`

  const userPrompt = `ARTIST:
- Name: ${artistName}
- Context: ${input.artistContext || 'not provided'}
- Genre/sound: ${input.genreSound || 'not provided'}
- Archetype: ${input.artistArchetype || 'not specified'}
- Visibility style: ${input.visibilityStyle || 'not specified'}

RELEASE:
- Title: ${input.campaignTitle}
- Type: ${input.releaseType || 'not specified'}
- Date: ${releaseDateFormatted}

Write the announcement.`

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
