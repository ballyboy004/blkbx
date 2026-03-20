'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CampaignError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: '#f2f2f0' }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-400">
        BLACKBOX
      </p>
      <div className="max-w-md text-center space-y-4">
        <p className="font-mono text-[14px] text-zinc-700">
          Something went wrong loading this campaign.
        </p>
        <p className="font-mono text-[12px] text-zinc-500">
          {error.message}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 rounded-full border border-zinc-300 text-zinc-600 hover:bg-white hover:border-zinc-400 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
