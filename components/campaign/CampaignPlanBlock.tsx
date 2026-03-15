'use client'

import { useState } from 'react'
import { generateCampaignTasks } from '@/app/campaign/[id]/actions'
import type { CampaignState } from '@/lib/modules/campaign/state'
import { resolveCampaignState } from '@/lib/modules/campaign/state'
import { components, typography, buttonClass } from '@/lib/design-system'

type CampaignPlanBlockProps = {
  campaignId: string
  initialState: CampaignState
}

export function CampaignPlanBlock({
  campaignId,
  initialState,
}: CampaignPlanBlockProps) {
  const [state, setState] = useState<CampaignState>(initialState)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setError(null)
    setIsGenerating(true)
    try {
      const result = await generateCampaignTasks(campaignId)
      setState(resolveCampaignState(result, null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate campaign plan')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 rounded-lg mt-6" style={components.card.elevated}>
      <h2 className={`${typography.cardHeader} mb-4`}>Campaign Plan</h2>
      {!state.hasTasks ? (
        <>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={buttonClass.primary}
          >
            {isGenerating ? 'Generating...' : 'Generate Campaign Plan'}
          </button>
          {error && (
            <p className="mt-3 font-mono text-[12px] text-red-400" role="alert">
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          {state.phases.map((phase) => {
            if (phase.tasks.length === 0) return null
            return (
              <div key={phase.phase} className="mt-6 first:mt-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                  {phase.label}
                </p>
                <div>
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border-b border-zinc-800 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
                    >
                      <p className={typography.body}>{task.title}</p>
                      {task.description && (
                        <p className="font-mono text-[12px] text-zinc-500 leading-relaxed mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
