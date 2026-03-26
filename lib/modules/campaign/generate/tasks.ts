import Anthropic from '@anthropic-ai/sdk'
import type { CampaignTaskPhase } from '../types'

type SubTask = {
  title: string
  description: string
  order_index: number
  due_date_offset?: number
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
  role?: string | null
  executionSignals?: {
    time_to_complete_by_type?: Record<string, number[]>
    deliverable_rate?: number
    stall_patterns?: Record<string, number>
  } | null
  strengths?: string | null
  weaknesses?: string | null
  primaryBlocker?: string | null
  projectStatus?: string | null
  artistArchetype?: string | null
  visibilityStyle?: string | null
  releasePhilosophy?: string | null
  audienceRelationship?: string | null
  referenceArtists?: string | null
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

DUE DATE RULES:
- Every sub-task must include a "due_date_offset" field — an integer representing days relative to release date
- Negative numbers = days BEFORE release (e.g. -21 = 3 weeks before release)
- Zero = release day
- Positive numbers = days AFTER release (e.g. 7 = one week after release)
- Preparation tasks: offsets between -28 and -8
- Launch tasks: offsets between -7 and 0
- Post-release tasks: offsets between 1 and 21
- Distribute tasks realistically — not all on the same day
- Space preparation tasks at least 2-3 days apart
- Space launch tasks across the 7-day window
- Space post-release tasks across 2 weeks

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
            { "title": "...", "description": "...", "order_index": 0, "due_date_offset": -21 },
            { "title": "...", "description": "...", "order_index": 1, "due_date_offset": -14 }
          ]
        }
      ]
    },
    { "phase": "launch", "milestones": [...] },
    { "phase": "post_release", "milestones": [...] }
  ]
}
No markdown. No preamble. Valid JSON only.`

const PRODUCER_SYSTEM_PROMPT = `You are a music industry strategist who has worked closely with independent producers grinding for placements. You understand how placements actually happen — not through formal channels, but through relationships, consistency, and getting your sound in front of the right people at the right time.

Generate a lean, high-impact placement and brand campaign for this producer.

HOW PLACEMENTS ACTUALLY HAPPEN — understand this before generating tasks:
1. Find the artists whose sound fits your style
2. Study who's already producing for them — those producers are your benchmark and a potential connection
3. Build relationships with other producers in your target artists' camps — send loops, collab, get in the room
4. Send beats directly to artists — personalized DMs with a free download, not a sales pitch
5. Post beat videos on Reels, TikTok, and Shorts consistently — inbound discovery is real
6. Build a YouTube type beat catalog so artists find you through search
7. Send loops and samples to artists and producers, not just full beats — loops get you in the door faster
8. Network with other producers for co-production and referrals

WHAT GOOD PRODUCER TASKS ACTUALLY LOOK LIKE:
- "Find 10 artists in [genre] whose sound matches your production style — check their Spotify credits for who's producing for them"
- "Research the producers already in [target artist]'s camp — follow them, study their sound, find a connection point"
- "DM 10 artists with a personalized message referencing their specific sound and a free beat download link"
- "Post a beat-making Reel showing your process for [specific sound/technique] — no talking, just the process"
- "Upload a '[genre] type beat' to YouTube with proper SEO: tempo, key, mood in the title and description"
- "Send a loop pack (4-6 loops) to 5 producers you've identified in your target artists' camps"
- "DM a producer whose work you respect — comment on something specific about their sound before pitching anything"
- "Post a 'I made this beat in 20 minutes' TikTok using a trending sound as the base"
- "Upload 8 beats to BeatStars with proper tags: artist names, tempo, key, mood — artists search this way"
- "Submit 3 beats to SubmitHub targeting curators and artists in your genre"
- "Follow up with any artist who listened to your beat but didn't respond — one message, no desperation"

HARD LIMITS:
- Maximum 20 sub-tasks total. Aim for 15-18.
- Maximum 3 milestones per phase
- Maximum 3 sub-tasks per milestone
- Zero duplicates — every task must be meaningfully different
- Never generate corporate-sounding tasks like "establish brand guidelines" or "develop outreach strategy"
- Never generate tasks that are just thinking or planning — every task is a real action in the world

PHASE DEFINITIONS:
- preparation: Get your infrastructure ready — catalog uploaded, target list built, content shot (first 1-2 weeks)
- launch: Active outreach and posting — DMing artists, sending loops to producers, posting beat videos (weeks 2-4)
- post_release: Follow-up, relationship deepening, and momentum — not starting over, building on what you started (weeks 4-6)

DUE DATE RULES:
- Every sub-task must include a "due_date_offset" field — days from campaign start date
- Preparation: offsets 0 to 7
- Launch: offsets 7 to 21
- Post-release: offsets 21 to 42
- Space tasks at least 1-2 days apart within the same phase
- Don't pile tasks on the same day

QUALITY CHECK before finalizing:
1. Does each task sound like something a real producer would actually do? If not, rewrite it.
2. Any two tasks accomplish the same thing? Drop one.
3. Is the list heavy on outreach, content, and relationship-building — not admin? Good.
4. Are tasks specific to this producer's sound and genre? If they could apply to any producer, make them specific.

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
            { "title": "...", "description": "...", "order_index": 0, "due_date_offset": 1 }
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
    due_date_offset?: number | null
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

  const isProducer = input.role === 'producer'
  const systemPrompt = isProducer ? PRODUCER_SYSTEM_PROMPT : SYSTEM_PROMPT

  const userPrompt = isProducer
    ? `PRODUCER CONTEXT:
- Name: ${artistName}
- Genre/sound speciality: ${input.genreSound || 'not provided'}
- Goals: ${goalsLine}
- Current status: ${input.projectStatus || 'not specified'}
- Strengths: ${input.strengths || 'not specified'}
- Weaknesses / gaps: ${input.weaknesses || 'not specified'}
- Biggest blocker: ${input.primaryBlocker || 'not specified'}
- Constraints: ${input.constraints || 'none specified'}
- Campaign focus: ${input.campaignTitle}
${skipBlock ? `\nBEHAVIORAL CONTEXT:\n${skipBlock}` : ''}
${executionBlock ? `\n${executionBlock}` : ''}

Generate the placement campaign plan.`
    : `ARTIST:
- Name: ${artistName}
- Genre/sound: ${input.genreSound || 'not provided'}
- Career stage: ${input.careerStage || 'not provided'}
- Artist archetype: ${input.artistArchetype || 'not specified'}
- Visibility style: ${input.visibilityStyle || 'not specified'}
- Release philosophy: ${input.releasePhilosophy || 'not specified'}
- Audience relationship: ${input.audienceRelationship || 'not specified'}
- Reference artists/career models: ${input.referenceArtists || 'not specified'}
- Strengths: ${input.strengths || 'not specified'}
- Weaknesses / gaps: ${input.weaknesses || 'not specified'}
- Biggest blocker: ${input.primaryBlocker || 'not specified'}
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
    system: systemPrompt,
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
        due_date_offset: st.due_date_offset ?? null,
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
