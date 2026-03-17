// Workspace intelligence contracts — pure functions only. No async, no DB, no API.

import type { Profile } from '@/lib/profile/profile'
import type { Campaign, CampaignStrategy, CampaignTaskPhase, ContentPieceType, ContentPiece } from './types'
import type { CampaignState } from './state'
import { PHASE_LABELS } from './state'

// ───────────────────────────────────────────
// 1. MissionCardData — directive-ready contract for the workspace client
// ───────────────────────────────────────────

export type MissionCardData = {
  campaignId: string
  campaignTitle: string
  releaseType: string | null
  releaseDate: string | null

  currentPhase: CampaignTaskPhase | null
  phaseLabel: string

  nextMoveLabel: string
  nextMoveText: string
  currentMilestoneTitle: string | null  // parent milestone of nextTask

  progressLabel: string
  progressPercent: number

  hasTasks: boolean
  hasStrategy: boolean
  isComplete: boolean
}

const ASSET_LABELS: Record<string, string> = {
  announcement: 'Announcement',
  press_release: 'Press release',
  email: 'Email announcement',
  captions: 'Social captions',
}

export function buildMissionCardData(
  campaign: Campaign,
  campaignState: CampaignState,
  pendingAssets?: ContentPiece[]
): MissionCardData {
  const phaseLabel = campaignState.currentPhase
    ? PHASE_LABELS[campaignState.currentPhase]
    : campaignState.isComplete
      ? 'Complete'
      : 'No plan yet'

  const firstPending = pendingAssets?.find(p => p.status === 'generated' && p.type !== 'strategy')
  const nextMoveText = firstPending
    ? `Review ${ASSET_LABELS[firstPending.type] ?? firstPending.type}`
    : campaignState.nextTask?.title
      ?? (campaignState.isComplete
        ? 'Campaign complete. Start your next release.'
        : 'Generate your campaign plan to get started.')

  const currentMilestoneTitle = firstPending
    ? null
    : campaignState.currentMilestone?.title ?? null

  const progressLabel = campaignState.totalTasks > 0
    ? `${campaignState.completedTasks} / ${campaignState.totalTasks} tasks complete`
    : 'No tasks yet'

  const progressPercent = campaignState.totalTasks > 0
    ? Math.round((campaignState.completedTasks / campaignState.totalTasks) * 100)
    : 0

  return {
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    releaseType: campaign.release_type,
    releaseDate: campaign.release_date,
    currentPhase: campaignState.currentPhase,
    phaseLabel,
    nextMoveLabel: 'NEXT MOVE',
    nextMoveText,
    currentMilestoneTitle,
    progressLabel,
    progressPercent,
    hasTasks: campaignState.hasTasks,
    hasStrategy: campaignState.hasStrategy,
    isComplete: campaignState.isComplete,
  }
}

// ───────────────────────────────────────────
// 2. WorkspaceChip — derived from real campaign state
// ───────────────────────────────────────────

export type WorkspaceChip = {
  id: string
  label: string
  prompt: string
}

export function resolveWorkspaceChips(
  campaignState: CampaignState,
  hasPendingAssets?: boolean
): WorkspaceChip[] {
  const chips: WorkspaceChip[] = []

  chips.push({
    id: 'explain',
    label: 'Explain this move',
    prompt: 'Why is this the right move right now? Be brief and direct.',
  })

  if (campaignState.hasTasks) {
    chips.push({
      id: 'rollout',
      label: 'Show rollout plan',
      prompt: 'Show me the rollout sequence. Phases only, one line each.',
    })
  }

  if (campaignState.hasTasks) {
    chips.push({
      id: 'map',
      label: 'Map campaign',
      prompt: 'Show me the full campaign task map. Group by phase.',
    })
  }

  if (!campaignState.hasTasks) {
    chips.push({
      id: 'generate',
      label: 'Build campaign plan',
      prompt: 'What should I do to get a campaign plan built for this release?',
    })
  }

  if (campaignState.hasTasks && !campaignState.hasStrategy) {
    chips.push({
      id: 'generate_strategy',
      label: 'Generate campaign assets',
      prompt: '',
    })
  }

  if (campaignState.hasStrategy && !hasPendingAssets) {
    chips.push({
      id: 'generate_assets',
      label: 'Generate campaign assets',
      prompt: '',
    })
  }

  return chips
}

// ───────────────────────────────────────────
// 2b. AssetStrategy — what to generate and how, from profile
// ───────────────────────────────────────────

export type AssetStrategy = {
  assets: ContentPieceType[]
  toneRules: string[]
  shouldGenerate: boolean
  rationale: string
}

function buildArchetypeToneRules(archetype: string | null): string[] {
  switch (archetype) {
    case 'cult artist':
      return [
        'No explanations. No hype.',
        'Short, intentional, cryptic.',
        'Let the work carry the weight.',
        'Avoid promotional language entirely.',
      ]
    case 'mainstream crossover':
      return [
        'Accessible and narrative-forward.',
        'Build the story arc.',
        'Energetic but not hollow.',
      ]
    case 'underground tastemaker':
      return [
        'Credibility-first.',
        'Scene-aware. Reference the culture, not the commerce.',
        'Never sound commercial or promotional.',
      ]
    case 'independent brand':
      return [
        'Professional but personal.',
        'Consistent voice. Identity-forward.',
        'The artist is the brand — write accordingly.',
      ]
    case 'genre pioneer':
      return [
        'Position the work as a statement.',
        'Educate and intrigue.',
        'Frame the release in the context of what it represents.',
      ]
    default:
      return [
        'Direct and grounded.',
        'No hype. No filler.',
      ]
  }
}

export function resolveAssetStrategy(profile: Profile): AssetStrategy {
  const visibility = profile.visibility_style
  const archetype = profile.artist_archetype
  const philosophy = profile.release_philosophy

  if (visibility === 'anonymous / music-first') {
    return {
      assets: [],
      toneRules: [],
      shouldGenerate: false,
      rationale:
        'Your release philosophy centers the music, not the artist. No promotional assets generated — the work speaks for itself.',
    }
  }

  if (visibility === 'scarce / mysterious') {
    return {
      assets: ['announcement'],
      toneRules: [
        'One statement. Not a pitch.',
        'Never explain. State, then stop.',
        'No hashtags. No call-to-action language.',
        'Silence is part of the strategy.',
      ],
      shouldGenerate: true,
      rationale:
        'Minimal footprint. One announcement only — the scarcity is intentional and part of the identity.',
    }
  }

  if (visibility === 'event-driven' || philosophy === 'event-driven') {
    return {
      assets: ['announcement', 'captions'],
      toneRules: [
        'Release-day only. No pre-release build-up.',
        'Declarative, not promotional.',
        'Let the moment carry the weight.',
        ...buildArchetypeToneRules(archetype),
      ],
      shouldGenerate: true,
      rationale:
        'Event-driven release. Assets generated for drop day only — no pre-release content aligns with this approach.',
    }
  }

  if (visibility === 'community-driven') {
    return {
      assets: ['captions', 'email'],
      toneRules: [
        'Talk to fans, not at them.',
        'Behind-the-scenes framing where possible.',
        'Inclusive language. No press-release formality.',
        ...buildArchetypeToneRules(archetype),
      ],
      shouldGenerate: true,
      rationale:
        'Community-first rollout. Fan email and social captions only — no press push aligns with this relationship style.',
    }
  }

  return {
    assets: ['announcement', 'captions', 'email', 'press_release'],
    toneRules: buildArchetypeToneRules(archetype),
    shouldGenerate: true,
    rationale:
      'Full rollout generated across all asset types — consistent presence is the strategy.',
  }
}

export type WorkItem = {
  id: string
  type: ContentPieceType
  label: string
  status: string
}

export function buildWorkItems(contentPieces: ContentPiece[]): WorkItem[] {
  return contentPieces
    .filter(p => p.type !== 'strategy' && p.status === 'generated')
    .map(p => ({
      id: p.id,
      type: p.type,
      label: ASSET_LABELS[p.type] ?? p.type,
      status: p.status,
    }))
}

// ───────────────────────────────────────────
// 3. WorkspaceMessage — consistent client/server console shape
// ───────────────────────────────────────────

export type WorkspaceMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function normalizeWorkspaceMessages(
  messages: WorkspaceMessage[]
): WorkspaceMessage[] {
  return messages
    .map(m => ({ role: m.role, content: m.content.trim() }))
    .filter(m => m.content.length > 0)
}

// ───────────────────────────────────────────
// 4. buildWorkspaceSystemPrompt — dynamic context for Claude
// ───────────────────────────────────────────

function parseStrategy(content: string | null): CampaignStrategy | null {
  if (!content) return null
  try {
    const parsed = JSON.parse(content)
    if (
      typeof parsed.analysis === 'string' &&
      Array.isArray(parsed.strategic_pillars) &&
      Array.isArray(parsed.risks) &&
      Array.isArray(parsed.opportunities) &&
      Array.isArray(parsed.immediate_actions)
    ) return parsed as CampaignStrategy
    return null
  } catch { return null }
}

export function buildWorkspaceSystemPrompt(
  profile: Profile,
  campaign: Campaign,
  campaignState: CampaignState,
  strategyContent: string | null
): string {
  const strategy = parseStrategy(strategyContent)

  const artistBlock = [
    `Artist: ${(profile as any).artist_name ?? profile.context ?? 'Independent artist'}`,
    profile.genre_sound ? `Genre/sound: ${profile.genre_sound}` : null,
    profile.career_stage ? `Stage: ${profile.career_stage}` : null,
    profile.artist_archetype ? `Career archetype: ${profile.artist_archetype}` : null,
    profile.visibility_style ? `Visibility style: ${profile.visibility_style}` : null,
    profile.release_philosophy ? `Release philosophy: ${profile.release_philosophy}` : null,
    profile.audience_relationship ? `Audience relationship: ${profile.audience_relationship}` : null,
    profile.reference_artists ? `Reference career models: ${profile.reference_artists}` : null,
    profile.strengths ? `Strengths: ${profile.strengths}` : null,
    profile.constraints ? `Constraints: ${profile.constraints}` : null,
    profile.current_focus ? `Current focus: ${profile.current_focus}` : null,
  ].filter(Boolean).join('\n')

  const campaignBlock = [
    `Campaign: ${campaign.title}`,
    campaign.release_type ? `Release type: ${campaign.release_type}` : null,
    campaign.release_date ? `Target release date: ${campaign.release_date}` : null,
    `Phase: ${campaignState.currentPhase ? PHASE_LABELS[campaignState.currentPhase] : 'Not started'}`,
    `Progress: ${campaignState.completedTasks} of ${campaignState.totalTasks} tasks complete`,
  ].filter(Boolean).join('\n')

  const nextTaskBlock = campaignState.nextTask
    ? `Current directive: ${campaignState.nextTask.title}${campaignState.nextTask.description ? `\nContext: ${campaignState.nextTask.description}` : ''}`
    : campaignState.isComplete
      ? 'Campaign is complete.'
      : 'No tasks generated yet.'

  const currentPhaseTasks = campaignState.currentPhase
    ? campaignState.phases
        .find(p => p.phase === campaignState.currentPhase)
        ?.tasks.filter(t => t.status === 'pending')
        .map(t => `- ${t.title}`)
        .join('\n') ?? ''
    : ''

  const phaseTasksBlock = currentPhaseTasks
    ? `Remaining tasks in current phase:\n${currentPhaseTasks}`
    : ''

  const strategyBlock = strategy
    ? [
        `Strategic pillars:\n${strategy.strategic_pillars.map(p => `- ${p}`).join('\n')}`,
        `Opportunities:\n${strategy.opportunities.map(o => `- ${o}`).join('\n')}`,
        `Risks:\n${strategy.risks.map(r => `- ${r}`).join('\n')}`,
      ].join('\n\n')
    : ''

  const responseRules = `RESPONSE RULES — follow these strictly:
- Never write paragraphs or prose explanations.
- Always respond with short labeled blocks.
- Use this format:

  LABEL
  Short value or 1-line statement.

- For lists, use one item per line with a dash prefix.
- Maximum 4–6 lines per response unless the user asks for more detail.
- If showing phases or steps, show them as a short vertical sequence.
- Bold key terms using **term** syntax.
- Sound like a system that already knows the answer — not one explaining itself.
- Never use more than 2 blank lines between sections.`

  return [
    'You are BLACKBOX — an intelligent career operating system for independent artists.',
    'You have full context on this artist\'s campaign and profile. Answer with authority.',
    '',
    'ARTIST CONTEXT',
    artistBlock,
    '',
    'CAMPAIGN CONTEXT',
    campaignBlock,
    '',
    nextTaskBlock,
    phaseTasksBlock ? '\n' + phaseTasksBlock : '',
    strategyBlock ? '\nSTRATEGY CONTEXT\n' + strategyBlock : '',
    '',
    responseRules,
  ].filter(s => s !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
