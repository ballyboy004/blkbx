'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { askBlackbox, generateCampaignTasks } from '@/app/campaign/[id]/actions'
import type {
  WorkspaceMessage,
  MissionCardData,
  WorkspaceChip,
} from '@/lib/modules/campaign/intelligence'
import { components, typography } from '@/lib/design-system'
import { Logo } from '@/components/ui/Logo'

// ─── Page background (matches dashboard) ─────────────────────────────────────
function PageBackground() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(30, 40, 60, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(40, 30, 50, 0.5) 0%, transparent 50%),
            #0a0a0a
          `,
        }}
      />
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(30,30,30,0.2) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at center, rgba(40,40,40,0.1) 0%, transparent 60%)',
            boxShadow: 'inset 0 0 150px 80px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </>
  )
}

// ─── Mission card (real data from props) ──────────────────────────────────────
function MissionCard({ mission }: { mission: MissionCardData }) {
  const subtitle = [mission.campaignTitle, mission.releaseType, mission.phaseLabel]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div
        className="absolute inset-0 -z-10 rounded-[4px] opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(40, 40, 50, 0.15) 0%, transparent 70%)',
          transform: 'translateY(8px) scale(1.02)',
        }}
      />
      <motion.article
        className="w-full max-w-2xl p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden"
        style={components.card.elevated}
        initial={false}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      >
        <p className={typography.label}>CURRENT MISSION</p>
        <p className={typography.small + ' mt-3'}>{subtitle || 'No campaign'}</p>

        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <p className={typography.label + ' mb-2'}>{mission.nextMoveLabel}</p>
          <p className={typography.taskTitle + ' leading-snug'}>{mission.nextMoveText}</p>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/20"
              initial={{ width: 0 }}
              animate={{ width: `${mission.progressPercent}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
          <span className={typography.small + ' tabular-nums'}>{mission.progressLabel}</span>
        </div>
      </motion.article>
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
    <div className="w-full max-w-xl mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {chips.map((chip) => (
        <motion.button
          key={chip.id}
          type="button"
          onClick={() => onAction(chip)}
          disabled={disabled}
          className="px-4 py-2.5 min-h-[44px] rounded border transition-colors disabled:opacity-50 disabled:pointer-events-none"
          style={components.pill.inactive}
          whileHover={components.pill.active as React.CSSProperties}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <span className={typography.pill}>{chip.label}</span>
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
              className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500 mt-3 first:mt-0"
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
              style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: 4 }}
            >
              <span style={{ color: 'rgba(255,255,255,0.25)', marginRight: 8 }}>—</span>
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
            style={{ color: 'rgba(255,255,255,0.78)' }}
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
      className="w-full max-w-xl overflow-hidden relative"
      style={components.card.elevated}
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
    >
      {onMinimize && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-white/[0.06]">
          <motion.button
            type="button"
            onClick={onMinimize}
            className={
              typography.button +
              ' text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 -mr-1.5 rounded-sm'
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
            className="overflow-y-auto px-5 pt-5 chat-panel-scroll"
            style={{ maxHeight: 280, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                  {msg.role === 'assistant' ? (
                    <div className="max-w-[88%] inline-block text-left">
                      {renderContent(msg.content)}
                    </div>
                  ) : (
                    <span
                      className={
                        typography.small +
                        ' inline-block max-w-[88%] text-right text-zinc-500'
                      }
                    >
                      {msg.content}
                    </span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-left">
                  <span className={typography.small + ' text-zinc-600 animate-pulse'}>
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
            ' text-white placeholder:text-zinc-500'
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
                ' text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center'
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
}

export function WorkspaceScreen({ campaignId, mission, chips }: WorkspaceScreenProps) {
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
    sendMessage(chip.prompt)
  }

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages, loading])

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <style>{`
        .chat-panel-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.2) rgba(255,255,255,0.04);
        }
        .chat-panel-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .chat-panel-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.04);
        }
        .chat-panel-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.18);
          border-radius: 4px;
        }
        .chat-panel-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.25);
        }
        .chat-panel-scroll::-webkit-scrollbar-thumb:active {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
      <PageBackground />

      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        <div className="px-4 sm:px-6 md:px-10 py-8 sm:py-12">
          <div className="max-w-[1100px] mx-auto space-y-6 sm:space-y-8">
            <header className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Logo size="md" href="/" />
                <p className="text-xs uppercase tracking-[0.2em] font-mono text-zinc-500">
                  Workspace
                </p>
              </div>
            </header>

            <main className="flex flex-col items-center pt-4 pb-32 sm:pb-36">
              <MissionCard mission={mission} />
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
              className="w-full max-w-xl overflow-hidden flex items-center gap-2 px-4 py-3 sm:py-4"
              style={components.card.elevated}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              {messages.length > 0 && (
                <motion.button
                  type="button"
                  onClick={() => setMinimized(false)}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded"
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
                  ' text-white placeholder:text-zinc-500'
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
                      ' text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0'
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
              className="w-full max-w-xl"
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
