import Anthropic from '@anthropic-ai/sdk'
import type { CampaignTaskPhase } from '../types'

type SubTask = {
  title: string
  description: string
  order_index: number
}

type Milestone = {
  title: string
  description: string
  phase: CampaignTaskPhase
  order_index: number
  sub_tasks: SubTask[]
}

type MilestoneOutput = {
  phases: {
    phase: CampaignTaskPhase
    milestones: Milestone[]
  }[]
}

// Flat output with parent_id resolved (placeholder only – not used by callers yet)
export type CampaignTaskWithParent = {
  title: string
  description: string
  phase: CampaignTaskPhase
  order_index: number
  parent_id: string | null // null for milestones, resolved ID for sub-tasks
}

export type CampaignTaskGeneratorInput = {
  artistName: string
  artistContext: string
  genreSound: string
  careerStage: string
  constraints: string
  goals: string[] | null           // from campaign_goals in profile
  readinessChecklist: string[]     // from readiness_checklist in profile
  campaignTitle: string
  releaseType: string | null
  releaseDate: string | null
  skipPatterns?: Record<string, number> | null
}

const SYSTEM_PROMPT = `You are a music release campaign strategist for independent artists.
Generate a campaign execution plan as milestones with sub-tasks.

CRITICAL RULES:
- Tasks must be real-world actions the artist takes — not internal app actions
- Never generate tasks like "review your assets" or "check your dashboard"
- Every task must be something that happens in the world: sending an email,
  posting content, making a call, submitting to a platform, reaching out to someone
- Tasks must be specific to this artist's sound, constraints, and goals
- Skip tasks covered by the readiness checklist — if Spotify editorial is already
  submitted, do not include it
- If the artist has limited time, reduce sub-task count per milestone

STRUCTURE:
- 3 phases: preparation, launch, post_release
- 2-4 milestones per phase
- 2-5 sub-tasks per milestone
- Milestones are strategic objectives (e.g. "Build curator pipeline")
- Sub-tasks are concrete daily actions (e.g. "Research 15 playlists in your genre on Spotify")

REAL-WORLD TASK EXAMPLES (use this level of specificity):
- "Submit to Spotify for Artists editorial — do this at least 7 days before release"
- "Research 20 playlist curators in [genre] on Spotify and note their submission method"
- "Write a personalized pitch email to 10 curators referencing their specific playlist"
- "Post a 15-second teaser clip to TikTok and Instagram Reels — use the hook from your track"
- "DM 5 micro-influencers in your genre asking if they'd use your track"
- "Send fan email to your list 24 hours before release — keep it personal, not promotional"
- "Update Spotify for Artists profile photo and bio to match release aesthetic"
- "Pin your pre-save link in bio on all platforms simultaneously"
- "Post day-2 content: lyric breakdown or studio context for the track"
- "Follow up with curators who haven't responded — one polite message only"

Respond ONLY with valid JSON matching this exact structure:
{
  "phases": [
    {
      "phase": "preparation",
      "milestones": [
        {
          "title": "...",
          "description": "one sentence — what this milestone achieves",
          "phase": "preparation",
          "order_index": 0,
          "sub_tasks": [
            { "title": "...", "description": "...", "order_index": 0 },
            { "title": "...", "description": "...", "order_index": 1 }
          ]
        }
      ]
    },
    { "phase": "launch", "milestones": [...] },
    { "phase": "post_release", "milestones": [...] }
  ]
}
No markdown. No preamble. Valid JSON only.`

export type GeneratedMilestone = {
  title: string
  description: string
  phase: CampaignTaskPhase
  order_index: number
  sub_tasks: Array<{
    title: string
    description: string
    order_index: number
  }>
}

export async function generateTasksContent(
  input: CampaignTaskGeneratorInput
): Promise<GeneratedMilestone[]> {
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

  const goalsLine = input.goals && input.goals.length > 0
    ? input.goals.join(', ')
    : 'not specified'

  const readinessBlock =
    input.readinessChecklist && input.readinessChecklist.length > 0
      ? input.readinessChecklist.map((r) => `- ${r}`).join('\n')
      : '- nothing checked yet'

  const skipBlock = input.skipPatterns && Object.keys(input.skipPatterns).length > 0
    ? `TASK TYPES THIS ARTIST CONSISTENTLY SKIPS (avoid recommending these):
${Object.entries(input.skipPatterns)
  .sort(([, a], [, b]) => b - a)
  .map(([type, count]) => `- ${type} (skipped ${count} time${count > 1 ? 's' : ''})`)
  .join('\n')}

Do not generate tasks of these types unless absolutely essential to the campaign.
If you must include them, note them as optional.`
    : ''

  const userPrompt = `ARTIST:
- Name: ${artistName}
- Genre/sound: ${input.genreSound || 'not provided'}
- Career stage: ${input.careerStage || 'not provided'}
- Constraints: ${input.constraints || 'none specified'}
- Goals: ${goalsLine}

CAMPAIGN:
- Title: ${input.campaignTitle}
- Release type: ${input.releaseType ?? 'not specified'}
- Target release date: ${releaseDateFormatted}

ALREADY HANDLED (skip tasks for these):
${readinessBlock}
${skipBlock ? `\nBEHAVIORAL CONTEXT:\n${skipBlock}` : ''}

Generate the campaign execution plan.`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const firstBlock = response.content?.[0]
  if (firstBlock?.type !== 'text' || typeof firstBlock.text !== 'string') {
    throw new Error('Unexpected API response: missing text block')
  }

  const raw = firstBlock.text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(raw) as MilestoneOutput

  const milestones: GeneratedMilestone[] = []

  for (const phaseBlock of parsed.phases ?? []) {
    const phase = phaseBlock.phase
    for (const m of phaseBlock.milestones ?? []) {
      const subTasks = (m.sub_tasks ?? []).map((st) => ({
        title: st.title,
        description: st.description,
        order_index: st.order_index,
      }))

      milestones.push({
        title: m.title,
        description: m.description,
        phase,
        order_index: m.order_index,
        sub_tasks: subTasks,
      })
    }
  }

  return milestones
}
