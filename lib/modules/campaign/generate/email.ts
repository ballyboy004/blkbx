import Anthropic from '@anthropic-ai/sdk'
import type { AssetGeneratorInput } from './asset-input'

export async function generateEmailContent(
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

  const systemPrompt = `You are writing a fan email announcement for an independent artist's music release.
This email is from the artist directly to their audience — personal, not a newsletter blast.
Format exactly like this:

SUBJECT
[subject line]

BODY
[email body]

No marketing-speak. No "exciting news" openers. Write like a human.
Match the tone rules exactly — they define this artist's voice and audience relationship.

TONE RULES (follow exactly):
${input.toneRules.map((r) => `- ${r}`).join('\n')}

Respond with only the formatted email. No explanation, no preamble.`

  const userPrompt = `ARTIST:
- Name: ${artistName}
- Context: ${input.artistContext || 'not provided'}
- Genre/sound: ${input.genreSound || 'not provided'}
- Archetype: ${input.artistArchetype || 'not specified'}
- Audience relationship: ${input.audienceRelationship || 'not specified'}
- Reference artists: ${input.referenceArtists || 'not provided'}
- Constraints: ${input.constraints || 'none'}

RELEASE:
- Title: ${input.campaignTitle}
- Type: ${input.releaseType || 'not specified'}
- Date: ${releaseDateFormatted}

Write the email.`

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
