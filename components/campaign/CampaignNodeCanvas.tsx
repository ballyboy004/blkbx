'use client'

import { NodeCanvas, type OrbitNodeConfig } from '@/components/node/NodeCanvas'
import type { Campaign, CampaignStrategy } from '@/lib/modules/campaign/types'
import type { CampaignState } from '@/lib/modules/campaign/state'
import { PHASE_LABELS } from '@/lib/modules/campaign/state'

// Inline parseStrategy — same logic as CampaignStrategyBlock
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

// Shared empty state
function EmptyState({ message }: { message: string }) {
  return <p className="font-mono text-[12px] text-zinc-600">{message}</p>
}

// Shared section renderer for labeled lists
function Section({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-6">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 block mb-2">
        {label}
      </span>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="font-mono text-[13px] text-zinc-300 leading-relaxed">
            — {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

type CampaignNodeCanvasProps = {
  campaign: Campaign
  campaignState: CampaignState
  strategyContent: string | null
  headerSlot?: React.ReactNode
}

export function CampaignNodeCanvas({
  campaign,
  campaignState,
  strategyContent,
  headerSlot,
}: CampaignNodeCanvasProps) {
  const parsed = parseStrategy(strategyContent)

  // Center node
  const centerLabel = campaign.title
  const centerSublabel = campaignState.currentPhase
    ? PHASE_LABELS[campaignState.currentPhase]
    : campaignState.isComplete
    ? 'Complete'
    : 'No plan yet'

  // Orbit nodes — exactly 2: Analysis, Strategy
  const orbitNodes: [OrbitNodeConfig, OrbitNodeConfig] = [
    {
      id: 'analysis',
      label: 'Analysis',
      isEmpty: !campaignState.hasStrategy,
      panelTitle: 'Analysis',
      content: parsed ? (
        <div>
          <p className="font-mono text-[13px] text-zinc-300 leading-relaxed">{parsed.analysis}</p>
        </div>
      ) : (
        <EmptyState message="Generate a strategy to see analysis." />
      ),
    },
    {
      id: 'strategy',
      label: 'Strategy',
      isEmpty: !campaignState.hasStrategy,
      panelTitle: 'Strategy',
      content: parsed ? (
        <div>
          <Section label="Strategic Pillars" items={parsed.strategic_pillars} />
          <Section label="Opportunities" items={parsed.opportunities} />
          <Section label="Risks" items={parsed.risks} />
          <Section label="Immediate Actions" items={parsed.immediate_actions} />
        </div>
      ) : (
        <EmptyState message="Generate a strategy to see pillars, risks, and actions." />
      ),
    },
  ]

  const nextActionTitle = campaignState.nextTask?.title ?? null

  return (
    <NodeCanvas
      centerLabel={centerLabel}
      centerSublabel={centerSublabel}
      nextAction={nextActionTitle ?? undefined}
      orbitNodes={orbitNodes}
      headerSlot={headerSlot}
    />
  )
}
