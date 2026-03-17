'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { askBlackbox, generateCampaignTasks, generateAssets, generateStrategy } from '@/app/campaign/[id]/actions'
import type {
  WorkspaceMessage,
  MissionCardData,
  WorkspaceChip,
  WorkItem,
} from '@/lib/modules/campaign/intelligence'
import { typography } from '@/lib/design-system'

// ─── Page background — flat near-black ────────────────────────────────────────
function PageBackground() {
  return (
    <div className="absolute inset-0" style={{ background: '#0c0c0e' }} />
  )
}

// ─── Mission card (real data from props) ──────────────────────────────────────
function MissionCard({ mission }: { mission: MissionCardData }) {
  // When there's no plan yet, just show campaign title
  // When there's a phase, show title + phase only
  const subtitle = mission.hasTasks
    ? [mission.campaignTitle, mission.phaseLabel].filter(Boolean).join(' · ')
    : mission.campaignTitle

  return (
    <div className="relative w-full max-w-[600px] mx-auto">
      <motion.article
        className="w-full max-w-[600px] p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden"
        style={{
          background: '#131315',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '4px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        }}
        initial={false}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          CURRENT MISSION
        </p>
        <p className="font-mono text-[12px] text-zinc-400 mt-2">{subtitle || 'No campaign'}</p>

        <div className="border-t border-white/[0.06] mt-6" />
        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2">
            {mission.nextMoveLabel}
          </p>
          {mission.currentMilestoneTitle && (
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-700 mb-1">
              {mission.currentMilestoneTitle}
            </p>
          )}
          <p className="font-inter font-black text-[28px] sm:text-[32px] text-white leading-tight tracking-tight">
            {mission.nextMoveText}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/[0.07]">
            <motion.div
              className="h-full rounded-full bg-white/50"
              initial={{ width: 0 }}
              animate={{ width: `${mission.progressPercent}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
          <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
            {mission.progressLabel}
          </span>
        </div>
      </motion.article>
    </div>
  )
}

// ─── Work card (ready-for-review assets) ───────────────────────────────────────
function WorkCard({
  workItems,
  campaignId,
}: {
  workItems: WorkItem[]
  campaignId: string
}) {
  if (workItems.length === 0) return null

  return (
    <div className="relative w-full max-w-[600px] mx-auto mt-5">
      <motion.div
        className="w-full p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '4px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-4">
          READY FOR REVIEW
        </p>
        <div>
          {workItems.map((item) => (
            <motion.a
              key={item.id}
              href={`/campaign/${campaignId}/review/${item.id}`}
              className="flex items-center justify-between w-full py-3.5 border-b border-white/[0.05] last:border-b-0 group cursor-pointer"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/25 shrink-0" />
                <span className="font-mono text-[13px] text-zinc-300 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Review →
              </span>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Action chips (real chips from props; click = AI prompt or generate action) ─
function ActionChips({
  chips,
  onAction,
  disabled,
}: {
  chips: WorkspaceChip[]
  onAction: (chip: WorkspaceChip) => void
  disabled?: boolean
}) {
  return (
    <div className="w-full max-w-[600px] mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {chips.map((chip) => (
        <motion.button
          key={chip.id}
          type="button"
          onClick={() => onAction(chip)}
          disabled={disabled}
          className="font-mono text-[10px] uppercase tracking-[0.2em] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.45)',
            padding: '8px 14px',
          }}
          whileHover={{
            background: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.9)',
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {chip.label}
        </motion.button>
      ))}
    </div>
  )
}

// ─── Assistant message content renderer ───────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split('\n').filter((l, i, arr) => {
    if (l.trim() === '') return i === 0 || arr[i - 1].trim() !== ''
    return true
  })

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (trimmed === '') return <div key={i} className="h-1" />

        const parts = trimmed.split(/\*\*(.+?)\*\*/g)
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? (
            <span key={j} style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
              {part}
            </span>
          ) : (
            <span key={j}>{part}</span>
          )
        )

        const isLabel = /^[A-Z][A-Z\s\d\/\-·]+$/.test(trimmed) && trimmed.length < 32
        const isDash = trimmed.startsWith('- ')

        if (isLabel) {
          return (
            <p
              key={i}
              className="font-mono uppercase tracking-[0.25em] mt-3 first:mt-0"
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}
            >
              {trimmed}
            </p>
          )
        }

        if (isDash) {
          return (
            <p
              key={i}
              className="font-mono text-[12px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.65)', paddingLeft: 4 }}
            >
              <span style={{ color: 'rgba(255,255,255,0.2)', marginRight: 8 }}>—</span>
              {(() => {
                const dashParts = trimmed.slice(2).split(/\*\*(.+?)\*\*/g)
                return (
                  <>
                    {dashParts.map((p, j) =>
                      j % 2 === 1 ? (
                        <span
                          key={j}
                          style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}
                        >
                          {p}
                        </span>
                      ) : (
                        <span key={j}>{p}</span>
                      )
                    )}
                  </>
                )
              })()}
            </p>
          )
        }

        return (
          <p
            key={i}
            className="font-mono text-[12px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {rendered}
          </p>
        )
      })}
    </div>
  )
}

// ─── AI console ───────────────────────────────────────────────────────────────
function AIConsole({
  messages,
  input,
  loading,
  onInputChange,
  onSend,
  onMinimize,
  threadRef,
}: {
  messages: WorkspaceMessage[]
  input: string
  loading: boolean
  onInputChange: (v: string) => void
  onSend: (text: string) => void
  onMinimize?: () => void
  threadRef: React.RefObject<HTMLDivElement>
}) {
  const hasMessages = messages.length > 0

  return (
    <motion.div
      className="w-full max-w-[600px] overflow-hidden relative"
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
    >
      {onMinimize && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-white/[0.05]">
          <motion.button
            type="button"
            onClick={onMinimize}
            className={
              typography.button +
              ' text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 -mr-1.5 rounded-sm'
            }
            aria-label="Minimize chat"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.button>
        </div>
      )}
      <AnimatePresence>
        {hasMessages && (
          <motion.div
            ref={threadRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-y-auto px-5 pt-5 chat-panel-scroll border-b border-white/[0.05]"
            style={{ maxHeight: 280 }}
          >
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                  {msg.role === 'assistant' ? (
                    <div className="max-w-[88%] inline-block text-left font-mono text-[13px] text-zinc-300 leading-relaxed">
                      {renderContent(msg.content)}
                    </div>
                  ) : (
                    <span className="font-mono text-[13px] inline-block max-w-[88%] text-right text-zinc-600">
                      {msg.content}
                    </span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-left">
                  <span className="font-mono text-[13px] text-zinc-700 animate-pulse">
                    ···
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-4 py-3 sm:py-4">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend(input)
            }
          }}
          placeholder={
            hasMessages
              ? 'Continue…'
              : 'Ask BLACKBOX anything about your campaign…'
          }
          disabled={loading}
          className={
            'flex-1 bg-transparent outline-none disabled:opacity-50 ' +
            typography.input +
            ' text-white placeholder:text-zinc-700'
          }
          style={{ caretColor: 'rgba(255,255,255,0.5)' }}
        />
        <AnimatePresence>
          {(input.trim().length > 0 || loading) && (
            <motion.button
              type="button"
              onClick={() => onSend(input)}
              disabled={loading || !input.trim()}
              className={
                typography.button +
                ' text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center'
              }
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              Send
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────
export type WorkspaceScreenProps = {
  campaignId: string
  mission: MissionCardData
  chips: WorkspaceChip[]
  workItems: WorkItem[]
}

export function WorkspaceScreen({ campaignId, mission, chips, workItems }: WorkspaceScreenProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<WorkspaceMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(true)
  const threadRef = useRef<HTMLDivElement>(null)

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: WorkspaceMessage = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const reply = await askBlackbox(campaignId, next)
      setMessages((m) => [...m, { role: 'assistant' as const, content: reply }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant' as const, content: 'Something went wrong. Try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleChipAction(chip: WorkspaceChip) {
    if (loading) return
    if (chip.id === 'generate') {
      setMinimized(false)
      setLoading(true)
      try {
        await generateCampaignTasks(campaignId)
        router.refresh()
      } catch {
        setMessages((m) => [
          ...m,
          { role: 'assistant' as const, content: 'Failed to generate campaign plan. Try again.' },
        ])
      } finally {
        setLoading(false)
      }
      return
    }
    if (chip.id === 'generate_strategy') {
      setMinimized(false)
      setLoading(true)
      try {
        await generateStrategy(campaignId)
        await generateAssets(campaignId)
        router.refresh()
      } catch {
        setMessages((m) => [
          ...m,
          { role: 'assistant' as const, content: 'Failed to generate assets. Try again.' },
        ])
      } finally {
        setLoading(false)
      }
      return
    }
    if (chip.id === 'generate_assets') {
      setMinimized(false)
      setLoading(true)
      try {
        await generateAssets(campaignId)
        router.refresh()
      } catch {
        setMessages((m) => [
          ...m,
          { role: 'assistant' as const, content: 'Failed to generate assets. Try again.' },
        ])
      } finally {
        setLoading(false)
      }
      return
    }
    setMinimized(false)
    sendMessage(chip.prompt)
  }

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages, loading])

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: 'transparent' }}>
      <style>{`
        .chat-panel-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.12) rgba(255,255,255,0.03);
        }
        .chat-panel-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .chat-panel-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
        }
        .chat-panel-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .chat-panel-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.18);
        }
        .chat-panel-scroll::-webkit-scrollbar-thumb:active {
          background: rgba(255,255,255,0.18);
        }
      `}</style>
      <PageBackground />

      <div className="relative z-10 flex-1 flex flex-col min-h-screen overflow-y-auto">
        <div className="px-4 sm:px-6 md:px-10 pt-16 sm:pt-20 pb-64">
          <div className="max-w-[600px] mx-auto space-y-6 sm:space-y-8">
            <header className="mb-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                BLACKBOX / CAMPAIGN
              </p>
            </header>

            <main className="flex flex-col items-center">
              <MissionCard mission={mission} />
              <WorkCard workItems={workItems} campaignId={campaignId} />
              <ActionChips chips={chips} onAction={handleChipAction} disabled={loading} />
            </main>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center px-4 sm:px-6 md:px-10 pb-6 sm:pb-8">
        <AnimatePresence mode="wait">
          {minimized ? (
            <motion.div
              key="minimized"
              className="w-full max-w-[600px] overflow-hidden flex items-center gap-2 px-4 py-3 sm:py-4"
              style={{
                background: '#111113',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '4px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              {messages.length > 0 && (
                <motion.button
                  type="button"
                  onClick={() => setMinimized(false)}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 rounded"
                  aria-label="Expand chat"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 15l6-6 6 6" />
                  </svg>
                </motion.button>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                    setMinimized(false)
                  }
                }}
                placeholder="Ask BLACKBOX anything about your campaign…"
                disabled={loading}
                className={
                  'flex-1 min-w-0 bg-transparent outline-none disabled:opacity-50 ' +
                  typography.input +
                  ' text-white placeholder:text-zinc-700'
                }
                style={{ caretColor: 'rgba(255,255,255,0.5)' }}
              />
              <AnimatePresence>
                {(input.trim().length > 0 || loading) && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      sendMessage(input)
                      setMinimized(false)
                    }}
                    disabled={loading || !input.trim()}
                    className={
                      typography.button +
                      ' text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0'
                    }
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    Send
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[600px]"
            >
              <AIConsole
                messages={messages}
                input={input}
                loading={loading}
                onInputChange={setInput}
                onSend={sendMessage}
                onMinimize={() => setMinimized(true)}
                threadRef={threadRef}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
