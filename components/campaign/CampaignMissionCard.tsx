import Link from 'next/link'
import type { Campaign } from '@/lib/modules/campaign/types'
import type { CampaignState } from '@/lib/modules/campaign/state'
import { PHASE_LABELS } from '@/lib/modules/campaign/state'
import { components, typography } from '@/lib/design-system'

type CampaignMissionCardProps = {
  campaign: Campaign | null
  campaignState: CampaignState | null
}

export function CampaignMissionCard({
  campaign,
  campaignState,
}: CampaignMissionCardProps) {
  return (
    <div className="p-6 sm:p-8 md:p-10" style={components.card.elevated}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={typography.cardHeader}>Active Campaign</h2>
        {campaign && (
          <Link
            href={`/campaign/${campaign.id}`}
            className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300"
          >
            View →
          </Link>
        )}
      </div>

      {campaign === null ? (
        <>
          <p className={typography.body}>No active campaign.</p>
          <Link
            href="/campaign/new"
            className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300 mt-4 inline-block"
          >
            Start a campaign →
          </Link>
        </>
      ) : campaignState !== null ? (
        <div className="space-y-5">
          <div>
            <span className={`${typography.label} block mb-2`}>Campaign</span>
            <p className={typography.body}>{campaign.title}</p>
          </div>
          <div>
            <span className={`${typography.label} block mb-2`}>Current Phase</span>
            <p className={typography.body}>
              {campaignState.currentPhase
                ? PHASE_LABELS[campaignState.currentPhase]
                : campaignState.isComplete
                  ? 'Complete'
                  : '—'}
            </p>
          </div>
          {campaignState.nextTask !== null && (
            <div>
              <span className={`${typography.label} block mb-2`}>Next Action</span>
              <p className={typography.body}>{campaignState.nextTask.title}</p>
            </div>
          )}
          {campaignState.hasTasks && (
            <div>
              <span className={`${typography.label} block mb-2`}>Progress</span>
              <p className={typography.body}>
                {campaignState.completedTasks} of {campaignState.totalTasks} tasks
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
