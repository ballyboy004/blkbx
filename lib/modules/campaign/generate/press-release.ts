import Anthropic from '@anthropic-ai/sdk'
import type { AssetGeneratorInput } from './asset-input'

export async function generatePressReleaseContent(
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

  const systemPrompt = `You are writing a press release for an independent music artist.
Standard press release format. Third person. Factual. No hype language.
Written for music blogs, playlist curators, and music journalists.

Format exactly like this:

HEADLINE
[headline]

BODY
[3-4 paragraphs]

BOILERPLATE
[2-3 sentence artist bio]

CONTACT
[ARTIST NAME] | [EMAIL PLACEHOLDER]

Match the tone rules — even press releases have a voice.

TONE RULES (follow exactly):
${input.toneRules.map((r) => `- ${r}`).join('\n')}

Respond with only the formatted press release. No explanation, no preamble.`

  const userPrompt = `ARTIST:
- Name: ${artistName}
- Context: ${input.artistContext || 'not provided'}
- Genre/sound: ${input.genreSound || 'not provided'}
- Career stage: ${input.careerStage || 'not provided'}
- Archetype: ${input.artistArchetype || 'not specified'}
- Reference artists: ${input.referenceArtists || 'not provided'}

RELEASE:
- Title: ${input.campaignTitle}
- Type: ${input.releaseType || 'not specified'}
- Date: ${releaseDateFormatted}

Write the press release.`

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
