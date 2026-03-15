'use client'

import { useState } from 'react'
import { generateStrategy } from '@/app/campaign/[id]/actions'
import type { CampaignStrategy } from '@/lib/modules/campaign/types'
import { components, typography, buttonClass } from '@/lib/design-system'

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
    ) {
      return parsed as CampaignStrategy
    }
    return null
  } catch {
    return null
  }
}

type StrategyRow = {
  id: string
  content: string | null
  status: string
  created_at?: string
}

type CampaignStrategyBlockProps = {
  campaignId: string
  initialStrategy: StrategyRow | null
}

export function CampaignStrategyBlock({
  campaignId,
  initialStrategy,
}: CampaignStrategyBlockProps) {
  const [strategy, setStrategy] = useState<StrategyRow | null>(initialStrategy)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setError(null)
    setIsGenerating(true)
    try {
      const result = await generateStrategy(campaignId)
      setStrategy(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate strategy')
    } finally {
      setIsGenerating(false)
    }
  }

  const showStrategy = strategy?.content != null && strategy.content.length > 0
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <div className="p-6 sm:p-8 rounded-lg mt-6" style={components.card.elevated}>
      {showStrategy ? (
        <>
          <button
            type="button"
            onClick={() => setIsMinimized((m) => !m)}
            className="w-full flex justify-between items-center min-h-[44px] rounded px-1 -mx-1 transition-all text-left"
            style={{ boxShadow: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
              e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <h2 className={typography.cardHeader}>Strategy</h2>
            <span
              className="font-mono text-[12px] text-zinc-500 transition-transform duration-200"
              style={{ transform: isMinimized ? 'rotate(-90deg)' : 'rotate(0deg)' }}
              aria-hidden
            >
              ▼
            </span>
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{
              maxHeight: isMinimized ? 0 : 2000,
              opacity: isMinimized ? 0 : 1,
              marginTop: isMinimized ? 0 : 16,
            }}
          >
            {(() => {
              const parsed = parseStrategy(strategy?.content ?? null)
              if (parsed !== null) {
                return (
                  <div className="space-y-6">
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 block mb-2">
                        Analysis
                      </span>
                      <p className={typography.body}>{parsed.analysis}</p>
                    </div>
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 block mb-2">
                        Strategic Pillars
                      </span>
                      <ul className="space-y-2">
                        {parsed.strategic_pillars.map((item, i) => (
                          <li key={i} className={typography.body}>— {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 block mb-2">
                        Opportunities
                      </span>
                      <ul className="space-y-2">
                        {parsed.opportunities.map((item, i) => (
                          <li key={i} className={typography.body}>— {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 block mb-2">
                        Risks
                      </span>
                      <ul className="space-y-2">
                        {parsed.risks.map((item, i) => (
                          <li key={i} className={typography.body}>— {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 block mb-2">
                        Immediate Actions
                      </span>
                      <ul className="space-y-2">
                        {parsed.immediate_actions.map((item, i) => (
                          <li key={i} className={typography.body}>— {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              }
              return (
                <div className={`${typography.body} whitespace-pre-wrap`}>
                  {strategy?.content}
                </div>
              )
            })()}
          </div>
        </>
      ) : (
        <>
          <h2 className={`${typography.cardHeader} mb-4`}>Strategy</h2>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={buttonClass.primary}
          >
            {isGenerating ? 'Generating...' : 'Generate Strategy'}
          </button>
          {error && (
            <p className="mt-3 font-mono text-[12px] text-red-400" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
