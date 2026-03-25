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
  executionSignals?: {
    time_to_complete_by_type?: Record<string, number[]>
    deliverable_rate?: number
    stall_patterns?: Record<string, number>
  } | null
}

const SYSTEM_PROMPT = `You are a music release campaign strategist for independent artists.
Generate a lean, high-impact campaign execution plan.

HARD LIMITS — non-negotiable:
- Maximum 25 sub-tasks total across the entire campaign. Aim for 18-22.
- Maximum 3 milestones per phase (9 milestones total max)
- Maximum 3 sub-tasks per milestone
- No duplicate or near-duplicate tasks — if two tasks accomplish the same thing, pick the better one and drop the other
- Never repeat the same platform action twice (e.g. one Spotify editorial submission only, one curator email task only, one playlist research task only)
- Each sub-task must be meaningfully different from every other sub-task

TIMING RULES — tasks must reflect real campaign timing:
- Preparation tasks = things done MORE THAN 7 days before release
- Launch tasks = things done in the 7-day window before AND on release day
- Post-release tasks = things done in the 2 weeks AFTER release day
- If a release date is provided, make timing language specific (e.g. "3 weeks out", "release day", "day 3 after release")
- Preparation should have the fewest tasks — most heavy lifting is launch and post-release
- A motivated artist should be able to complete all preparation tasks in 1-2 focused work sessions
- Launch tasks should be distributed across days, not all on one day
- Post-release tasks should maintain momentum over 2 weeks, not front-load everything

QUALITY RULES:
- Every task must be a real-world action: posting, emailing, submitting, calling, DMing, recording
- Never generate tasks like "review your assets", "check your dashboard", "plan your strategy"
- Tasks must be specific to this artist's sound, genre, and constraints
- Skip anything already covered by the readiness checklist
- Be ruthless about cutting tasks that are low-leverage or redundant

STRUCTURE:
- 3 phases: preparation, launch, post_release
- 2-3 milestones per phase
- 2-3 sub-tasks per milestone
- Milestones are strategic objectives (e.g. "Build curator pipeline")
- Sub-tasks are concrete daily actions tied to that objective

BEFORE FINALIZING — do a self-check:
1. Are any two sub-tasks near-duplicates? If yes, drop one.
2. Does any platform appear more than once for the same action type? If yes, merge or drop.
3. Is the total sub-task count above 25? If yes, cut the weakest tasks first.
4. Are timing references specific and realistic? If not, add them.

Respond ONLY with valid JSON matching this exact structure:
{
  "phases": [
    {
      "phase": "preparation",
      "milestones": [
        {
          "title": "...",
          "description": "one sentence — what this milestone achieves and roughly when",
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

  const executionBlock = input.executionSignals ? (() => {
    const lines: string[] = []
    const ttc = input.executionSignals.time_to_complete_by_type
    if (ttc && Object.keys(ttc).length > 0) {
      const avgByType = Object.entries(ttc).map(([type, times]) => {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        return `- ${type}: avg ${avg}h to complete`
      }).join('\n')
      lines.push(`EXECUTION SPEED BY TASK TYPE (hours to complete on average):\n${avgByType}`)
      lines.push('Prioritize task types this artist completes quickly — they execute these with confidence.')
    }
    const stall = input.executionSignals.stall_patterns
    if (stall && Object.keys(stall).length > 0) {
      const stallLines = Object.entries(stall)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => `- ${type} (stalled ${count} times)`)
        .join('\n')
      lines.push(`STALL PATTERNS (task types this artist struggles to execute):\n${stallLines}`)
      lines.push('Reduce or simplify tasks of these types. Make them more concrete and smaller scope.')
    }
    return lines.join('\n\n')
  })() : ''

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
${executionBlock ? `\nEXECUTION INTELLIGENCE:\n${executionBlock}` : ''}

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
