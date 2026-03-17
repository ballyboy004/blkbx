'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  approveAsset,
  rejectAsset,
  saveEditedAsset,
  regenerateAsset,
} from '@/app/campaign/[id]/review/[assetId]/actions'
import type { ContentPiece, Campaign } from '@/lib/modules/campaign/types'

const ASSET_LABELS: Record<string, string> = {
  announcement: 'Announcement',
  press_release: 'Press release',
  email: 'Email announcement',
  captions: 'Social captions',
}

type Props = {
  piece: ContentPiece
  campaign: Campaign
  campaignId: string
}

export function AssetReviewScreen({ piece, campaign, campaignId }: Props) {
  const router = useRouter()
  const [content, setContent] = useState(piece.content ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setLoading('approve')
    setError(null)
    try {
      await approveAsset(piece.id, campaignId)
      router.push(`/campaign/${campaignId}`)
    } catch {
      setError('Failed to approve. Try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    setLoading('reject')
    setError(null)
    try {
      await rejectAsset(piece.id, campaignId)
      router.push(`/campaign/${campaignId}`)
    } catch {
      setError('Failed to reject. Try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleSave() {
    setLoading('save')
    setError(null)
    try {
      await saveEditedAsset(piece.id, content)
      setIsEditing(false)
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleRegenerate() {
    setLoading('regenerate')
    setError(null)
    try {
      const newPiece = await regenerateAsset(piece.id, campaignId)
      router.push(`/campaign/${campaignId}/review/${newPiece.id}`)
    } catch {
      setError('Failed to regenerate. Try again.')
    } finally {
      setLoading(null)
    }
  }

  const isDisabled = loading !== null

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-y-auto"
      style={{ background: '#0c0c0e' }}
    >
      {/* Header */}
      <div className="px-6 sm:px-10 pt-10 pb-6 max-w-[600px] mx-auto w-full">
        <Link
          href={`/campaign/${campaignId}`}
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← Back
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 sm:px-10 pb-16 max-w-[600px] mx-auto w-full">
        {/* Label */}
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
            {ASSET_LABELS[piece.type] ?? piece.type}
          </p>
          <p className="font-mono text-[12px] text-zinc-500 mt-1">
            {campaign.title}
          </p>
        </div>

        {/* Content area */}
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full font-mono text-[13px] text-zinc-300 leading-relaxed bg-transparent border border-white/10 rounded-sm p-4 resize-none outline-none focus:border-white/20 transition-colors"
            style={{ minHeight: 320 }}
          />
        ) : (
          <motion.div
            className="w-full p-6 sm:p-8"
            style={{
              background: '#161618',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <pre className="font-mono text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {content}
            </pre>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3 flex-wrap">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isDisabled}
                className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2.5 disabled:opacity-40 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  color: '#0c0c0e',
                  borderRadius: '2px',
                }}
              >
                {loading === 'save' ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setContent(piece.content ?? '')
                  setIsEditing(false)
                }}
                disabled={isDisabled}
                className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2.5 border border-white/12 text-zinc-400 hover:text-white hover:border-white/25 disabled:opacity-40 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isDisabled}
                className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2.5 disabled:opacity-40 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  color: '#0c0c0e',
                  borderRadius: '2px',
                }}
              >
                {loading === 'approve' ? 'Approving…' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isDisabled}
                className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2.5 border border-white/[0.12] text-zinc-400 hover:text-white hover:border-white/25 disabled:opacity-40 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isDisabled}
                className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2.5 border border-white/[0.12] text-zinc-400 hover:text-white hover:border-white/25 disabled:opacity-40 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                {loading === 'regenerate' ? 'Regenerating…' : 'Regenerate'}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isDisabled}
                className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2.5 text-zinc-700 hover:text-zinc-500 disabled:opacity-40 transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="font-mono text-[12px] text-red-400 mt-3">{error}</p>
        )}
      </div>
    </div>
  )
}
