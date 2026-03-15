import Anthropic from '@anthropic-ai/sdk'
import type { CampaignTaskPhase } from '../types'

type RawTaskItem = {
  title: string
  description: string
  phase: CampaignTaskPhase
  order_index: number
}

type RawTaskOutput = {
  phases: {
    phase: CampaignTaskPhase
    tasks: RawTaskItem[]
  }[]
}

export type CampaignTaskGeneratorInput = {
  artistName: string
  artistContext: string
  genreSound: string
  careerStage: string
  strengths: string
  constraints: string
  currentFocus: string
  campaignTitle: string
  releaseType: string | null
  releaseDate: string | null
}

const SYSTEM_PROMPT = `You are a music release campaign planner.
Generate a phased campaign task list for an independent artist preparing a music release.
Respond ONLY with valid JSON. No markdown, no explanation, no preamble.
The JSON must match this exact structure:
{
  "phases": [
    {
      "phase": "preparation",
      "tasks": [
        { "title": "...", "description": "...", "phase": "preparation", "order_index": 0 },
        ...
      ]
    },
    {
      "phase": "launch",
      "tasks": [...]
    },
    {
      "phase": "post_release",
      "tasks": [...]
    }
  ]
}
Generate 4–6 tasks per phase. Tasks must be specific to this artist's context, not generic.
order_index is 0-based within each phase.`

export async function generateTasksContent(
  input: CampaignTaskGeneratorInput
): Promise<RawTaskItem[]> {
  const artistName =
    input.artistName || input.artistContext || 'Independent artist'
  const releaseDateFormatted =
    input.releaseDate != null && input.releaseDate !== ''
      ? new Date(input.releaseDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'not set'

  const userPrompt = `ARTIST:
- Name: ${artistName}
- Context: ${input.artistContext || 'not provided'}
- Genre/sound: ${input.genreSound || 'not provided'}
- Career stage: ${input.careerStage || 'not provided'}
- Strengths: ${input.strengths || 'not provided'}
- Constraints: ${input.constraints || 'not provided'}
- Current focus: ${input.currentFocus || 'not provided'}

CAMPAIGN:
- Title: ${input.campaignTitle}
- Release type: ${input.releaseType ?? 'not specified'}
- Target release date: ${releaseDateFormatted}`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const firstBlock = response.content?.[0]
  if (firstBlock?.type !== 'text' || typeof firstBlock.text !== 'string') {
    throw new Error('Unexpected API response: missing text block')
  }

  const raw = firstBlock.text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(raw) as RawTaskOutput

  const flat: RawTaskItem[] = []
  for (const p of parsed.phases ?? []) {
    for (const t of p.tasks ?? []) {
      flat.push(t)
    }
  }
  return flat
}
