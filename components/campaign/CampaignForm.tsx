'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaign } from '@/app/campaign/new/actions'
import { typography, inputClass, buttonClass } from '@/lib/design-system'

const RELEASE_TYPES = [
  { value: '', label: '—' },
  { value: 'Single', label: 'Single' },
  { value: 'EP', label: 'EP' },
  { value: 'Album', label: 'Album' },
  { value: 'Mixtape', label: 'Mixtape' },
] as const

export function CampaignForm({ role }: { role?: string | null }) {
  const isProducer = role === 'producer'
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [releaseType, setReleaseType] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { id } = await createCampaign({
        title,
        release_type: releaseType,
        release_date: releaseDate,
      })
      router.push(`/campaign/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="p-3 rounded border border-red-500/30 bg-red-950/20 text-red-400 font-mono text-[12px]"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className={typography.label}>
          {isProducer ? 'Campaign focus' : 'Title'}
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder={isProducer ? 'e.g. trap beats, R&B placements' : 'Campaign name'}
          className={inputClass}
        />
      </div>

      {!isProducer && (
        <div className="space-y-2">
          <label htmlFor="release_type" className={typography.label}>
            Release type
          </label>
          <select
            id="release_type"
            value={releaseType}
            onChange={(e) => setReleaseType(e.target.value)}
            className={`${inputClass} w-full cursor-pointer`}
          >
            {RELEASE_TYPES.map(({ value, label }) => (
              <option key={value || 'empty'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="target_release_date" className={typography.label}>
          {isProducer ? 'Target timeframe (optional)' : 'Target release date'}
        </label>
        <div className="flex items-center gap-2">
          <input
            id="target_release_date"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            onInvalid={(e) => e.preventDefault()}
            className={inputClass}
            style={{ flex: 1 }}
          />
          {releaseDate && (
            <button
              type="button"
              onClick={() => setReleaseDate('')}
              className="font-mono text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1 shrink-0"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        className={buttonClass.primary}
      >
        {isSubmitting ? 'Creating…' : isProducer ? 'Start placement campaign' : 'Create campaign'}
      </button>
    </form>
  )
}
