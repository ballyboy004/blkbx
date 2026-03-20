'use client'

import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { askBlackbox, generateCampaignTasks, generateAssets, generateStrategy, completeTask, generateTaskBrief, saveTaskDeliverable, replanCampaign } from '@/app/campaign/[id]/actions'
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

// ─── GSAP text reveal components ──────────────────────────────────────────────
function MilestoneLabel({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0, x: 16 },
      { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
    )
  }, [text])
  return (
    <p
      ref={ref}
      className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-700 mb-1"
      style={{ opacity: 0 }}
    >
      {text}
    </p>
  )
}

function DirectiveText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      {
        opacity: 0,
        x: 32,
        rotateY: 5,
        transformOrigin: 'left center',
        filter: 'blur(2px)',
      },
      {
        opacity: 1,
        x: 0,
        rotateY: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'expo.out',
        delay: 0.08,
      }
    )
  }, [text])

  return (
    <p
      ref={ref}
      className="font-inter font-black text-[22px] sm:text-[26px] text-white leading-snug tracking-tight"
      style={{ opacity: 0, transformStyle: 'preserve-3d' }}
    >
      {text}
    </p>
  )
}

// ─── Mission card (real data from props) ──────────────────────────────────────
function MissionCard({
  mission,
  overrideText,
  overrideMilestone,
  overrideCompleted,
  hasTask,
  onTaskLogOpen,
  guideContent,
  guideLoading,
  onGuideRequest,
}: {
  mission: MissionCardData
  overrideText?: string | null
  overrideMilestone?: string | null
  overrideCompleted?: number | null
  hasTask: boolean
  onTaskLogOpen?: () => void
  guideContent: string | null
  guideLoading: boolean
  onGuideRequest: () => void
}) {
  const [view, setView] = useState<'mission' | 'guide'>('mission')
  const titleRef = useRef<HTMLDivElement>(null)
  const missionRef = useRef<HTMLDivElement>(null)
  const guideRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const subtitle = mission.hasTasks
    ? [mission.campaignTitle, mission.phaseLabel].filter(Boolean).join(' · ')
    : mission.campaignTitle

  const directiveText = overrideText ?? mission.nextMoveText
  const milestoneText = overrideMilestone !== undefined ? overrideMilestone : mission.currentMilestoneTitle
  const displayCompleted = overrideCompleted ?? mission.completedTasks
  const displayPercent = mission.totalTasks > 0
    ? Math.round((displayCompleted / mission.totalTasks) * 100)
    : mission.progressPercent
  const displayLabel = mission.totalTasks > 0
    ? `${displayCompleted} / ${mission.totalTasks} tasks complete`
    : mission.progressLabel

  useEffect(() => {
    if (!missionRef.current || !guideRef.current) return
    gsap.set(missionRef.current, { opacity: 1, y: 0, pointerEvents: 'auto' })
    gsap.set(guideRef.current, { opacity: 0, y: 12, pointerEvents: 'none' })
  }, [])

  useEffect(() => {
    if (!containerRef.current || !missionRef.current) return
    containerRef.current.style.height = missionRef.current.scrollHeight + 'px'
  }, [])

  useEffect(() => {
    if (!missionRef.current || !guideRef.current || !containerRef.current) return

    if (view === 'guide') {
      const guideHeight = guideRef.current.scrollHeight
      const tl = gsap.timeline()
      tl.to(missionRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.2,
        ease: 'power2.in',
        pointerEvents: 'none',
      })
      tl.to(containerRef.current, {
        height: guideHeight,
        duration: 0.28,
        ease: 'power3.inOut',
      }, '-=0.05')
      tl.to(guideRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out',
        pointerEvents: 'auto',
      }, '-=0.1')
    } else {
      const missionHeight = missionRef.current.scrollHeight
      const tl = gsap.timeline()
      tl.to(guideRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.2,
        ease: 'power2.in',
        pointerEvents: 'none',
      })
      tl.to(containerRef.current, {
        height: missionHeight,
        duration: 0.28,
        ease: 'power3.inOut',
      }, '-=0.05')
      tl.to(missionRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out',
        pointerEvents: 'auto',
      }, '-=0.1')
    }
  }, [view])

  useEffect(() => {
    setView('mission')
  }, [directiveText])

  return (
    <div className="relative w-full max-w-[600px] mx-auto">
      <motion.article
        className="w-full max-w-[600px] p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden"
        style={{
          background: '#131315',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '4px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
        initial={false}
      >
        <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Mission view */}
          <div
            ref={missionRef}
            style={{ position: 'absolute', width: '100%', top: 0, left: 0 }}
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
              {milestoneText && (
                <MilestoneLabel text={milestoneText} />
              )}
              <div
                ref={titleRef}
                className="cursor-pointer"
                onClick={() => {
                  if (!hasTask || view === 'guide') return
                  onGuideRequest()
                  setView('guide')
                }}
                onMouseEnter={() => {
                  if (!hasTask) return
                  const p = titleRef.current?.querySelector('p')
                  const tl = gsap.timeline()
                  tl.to(p, {
                    textShadow: '0 1px 3px rgba(255,255,255,0.08), 0 0 0 rgba(255,255,255,0), 0 0 0 rgba(255,255,255,0)',
                    duration: 0.1,
                    ease: 'power1.out',
                  })
                  tl.to(p, {
                    textShadow: '0 1px 3px rgba(255,255,255,0.08), 0 3px 10px rgba(255,255,255,0.06), 0 0 0 rgba(255,255,255,0)',
                    duration: 0.1,
                    ease: 'power1.out',
                  }, '+=0.04')
                  tl.to(p, {
                    textShadow: '0 1px 3px rgba(255,255,255,0.08), 0 3px 10px rgba(255,255,255,0.06), 0 6px 24px rgba(255,255,255,0.04)',
                    duration: 0.1,
                    ease: 'power1.out',
                  }, '+=0.04')
                }}
                onMouseLeave={() => {
                  gsap.to(titleRef.current?.querySelector('p'), {
                    textShadow: '0 0 0 rgba(255,255,255,0)',
                    duration: 0.35,
                    ease: 'power2.inOut',
                  })
                }}
              >
                <DirectiveText text={directiveText} />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/[0.07]">
                <motion.div
                  className="h-full rounded-full bg-white/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${displayPercent}%` }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                  {displayLabel}
                </span>
                {onTaskLogOpen && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onTaskLogOpen() }}
                    className="font-mono text-[9px] uppercase tracking-[0.25em] hover:text-zinc-400 transition-colors"
                    style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                  >
                    Task Log
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Guide view */}
          <div
            ref={guideRef}
            style={{ position: 'absolute', width: '100%', top: 0, left: 0 }}
          >
            <button
              type="button"
              onClick={() => {
                setView('mission')
              }}
              className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-2 mb-6"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>›</span>
              Back
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-4">
              HOW TO EXECUTE
            </p>
            {guideLoading ? (
              <p className="font-mono text-[11px] text-zinc-600 animate-pulse">Loading guide...</p>
            ) : guideContent ? (
              <p className="font-mono text-[12px] text-zinc-400 leading-[1.9] whitespace-pre-line">
                {guideContent}
              </p>
            ) : null}
          </div>

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
        <AnimatePresence initial={false}>
          {workItems.map((item) => (
            <motion.a
              key={item.id}
              href={`/campaign/${campaignId}/review/${item.id}`}
              className="flex items-center justify-between w-full py-3.5 border-b border-white/[0.05] last:border-b-0 group cursor-pointer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="flex items-center gap-3 pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-white/25 shrink-0" />
                <span className="font-mono text-[13px] text-zinc-300 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 transition-colors pointer-events-none">
                Review →
              </span>
            </motion.a>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ─── Task actions (done / skip) ───────────────────────────────────────────────
function TaskActions({
  onDone,
  onSkip,
  disabled,
}: {
  onDone: () => void
  onSkip: () => void
  disabled?: boolean
}) {
  const doneRef = useRef<HTMLButtonElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)

  function animateIn(el: HTMLButtonElement | null, delay: number) {
    if (!el) return
    gsap.fromTo(el,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', delay }
    )
  }

  useEffect(() => {
    animateIn(doneRef.current, 0.05)
    animateIn(skipRef.current, 0.1)
  }, [])

  function handleEnter(ref: React.RefObject<HTMLButtonElement>, bright: boolean) {
    if (!ref.current || disabled) return
    gsap.to(ref.current, {
      borderColor: bright ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)',
      backgroundColor: bright ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
      color: bright ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
      duration: 0.12,
      ease: 'power1.out',
    })
  }

  function handleLeave(ref: React.RefObject<HTMLButtonElement>, bright: boolean) {
    if (!ref.current) return
    gsap.to(ref.current, {
      borderColor: bright ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
      backgroundColor: 'rgba(255,255,255,0)',
      color: bright ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
      duration: 0.18,
      ease: 'power1.inOut',
    })
  }

  return (
    <div className="flex items-center gap-2 mt-3 max-w-[600px] mx-auto">
      <button
        ref={doneRef}
        type="button"
        onClick={onDone}
        disabled={disabled}
        onMouseEnter={() => handleEnter(doneRef, true)}
        onMouseLeave={() => handleLeave(doneRef, true)}
        className="flex-1 font-mono text-[10px] uppercase tracking-[0.2em] py-2.5 disabled:pointer-events-none"
        style={{
          opacity: 0,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '4px',
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        Done
      </button>
      <button
        ref={skipRef}
        type="button"
        onClick={onSkip}
        disabled={disabled}
        onMouseEnter={() => handleEnter(skipRef, false)}
        onMouseLeave={() => handleLeave(skipRef, false)}
        className="font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 disabled:pointer-events-none"
        style={{
          opacity: 0,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '4px',
          color: 'rgba(255,255,255,0.25)',
        }}
      >
        Skip
      </button>
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
      {chips.map((chip, i) => (
        <ChipButton
          key={chip.id}
          chip={chip}
          index={i}
          disabled={disabled}
          onAction={onAction}
        />
      ))}
    </div>
  )
}

function ChipButton({
  chip,
  index,
  disabled,
  onAction,
}: {
  chip: WorkspaceChip
  index: number
  disabled?: boolean
  onAction: (chip: WorkspaceChip) => void
}) {
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0, y: 6 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power2.out',
        delay: 0.15 + index * 0.05,
      }
    )
  }, [index])

  function handleMouseEnter() {
    if (!ref.current || disabled) return
    gsap.to(ref.current, {
      borderColor: 'rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.04)',
      color: 'rgba(255,255,255,0.9)',
      duration: 0.12,
      ease: 'power1.out',
    })
  }

  function handleMouseLeave() {
    if (!ref.current) return
    gsap.to(ref.current, {
      borderColor: 'rgba(255,255,255,0.08)',
      backgroundColor: 'rgba(255,255,255,0)',
      color: 'rgba(255,255,255,0.45)',
      duration: 0.18,
      ease: 'power1.inOut',
    })
  }

  function handleMouseDown() {
    if (!ref.current) return
    gsap.to(ref.current, {
      borderColor: 'rgba(255,255,255,0.5)',
      backgroundColor: 'rgba(255,255,255,0.08)',
      duration: 0.06,
      ease: 'power1.in',
    })
  }

  function handleMouseUp() {
    if (!ref.current) return
    gsap.to(ref.current, {
      borderColor: 'rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.04)',
      duration: 0.1,
      ease: 'power1.out',
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onAction(chip)}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="font-mono text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 disabled:pointer-events-none"
      style={{
        opacity: 0,
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px',
        color: 'rgba(255,255,255,0.45)',
        padding: '8px 14px',
      }}
    >
      {chip.label}
    </button>
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

// ─── AI drawer ────────────────────────────────────────────────────────────────
function AIDrawer({
  messages,
  loading,
  onClose,
  threadRef,
  replanPending,
  onConfirmReplan,
}: {
  messages: WorkspaceMessage[]
  loading: boolean
  onClose: () => void
  threadRef: React.RefObject<HTMLDivElement>
  replanPending?: boolean
  onConfirmReplan?: () => void
}) {
  return (
    <>
      {/* Scrim */}
      <motion.div
        className="fixed inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Centered card panel */}
      <motion.div
        className="fixed z-40 w-full max-w-[600px] flex flex-col"
        style={{
          bottom: '80px',
          left: '50%',
          x: '-50%',
          maxHeight: '58vh',
          background: '#131315',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '4px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-[1px] bg-white/20" />
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-zinc-600">
              BLACKBOX
            </p>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-600 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
            whileTap={{ scale: 0.97 }}
          >
            <span>close</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        {/* Messages */}
        <div
          ref={threadRef}
          className="flex-1 overflow-y-auto chat-panel-scroll"
          style={{ padding: '20px', paddingBottom: '24px' }}
        >
          <div className="space-y-5">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-2">
                    {msg.content}
                  </p>
                ) : (
                  <div className="text-[12px] leading-relaxed">
                    {renderContent(msg.content)}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <span className="font-mono text-[12px] text-zinc-700 animate-pulse">···</span>
            )}
          </div>
        </div>
        {replanPending && onConfirmReplan && (
          <div style={{ padding: '0 20px 20px' }}>
            <button
              type="button"
              onClick={onConfirmReplan}
              className="font-mono text-[10px] uppercase tracking-[0.2em] w-full py-2.5"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
              }}
            >
              Confirm — Regenerate Plan
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}

// ─── Task queue drawer ────────────────────────────────────────────────────────
function TaskQueueDrawer({
  allTasks,
  completedTasks,
  tab,
  onTabChange,
  onClose,
  expandedTaskId,
  taskBriefs,
  loadingBriefId,
  onTaskExpand,
}: {
  allTasks: WorkspaceScreenProps['allTasks']
  completedTasks: WorkspaceScreenProps['completedTasks']
  tab: 'upcoming' | 'history'
  onTabChange: (t: 'upcoming' | 'history') => void
  onClose: () => void
  expandedTaskId: string | null
  taskBriefs: Record<string, string>
  loadingBriefId: string | null
  onTaskExpand: (id: string) => void
}) {
  const PHASE_ORDER = ['preparation', 'launch', 'post_release']
  const PHASE_LABELS: Record<string, string> = {
    preparation: 'Preparation',
    launch: 'Launch',
    post_release: 'After Release',
  }

  const upcomingByPhase = PHASE_ORDER.map(phase => ({
    phase,
    label: PHASE_LABELS[phase],
    tasks: allTasks.filter(t => t.phase === phase),
  })).filter(g => g.tasks.length > 0)

  const historyByPhase = PHASE_ORDER.map(phase => ({
    phase,
    label: PHASE_LABELS[phase],
    tasks: completedTasks.filter(t => t.phase === phase),
  })).filter(g => g.tasks.length > 0)

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed z-50 flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          x: '-50%',
          y: '-50%',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '72vh',
          background: '#131315',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '4px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          position: 'fixed',
        }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onTabChange('upcoming')}
              className="font-mono text-[10px] uppercase tracking-[0.25em] transition-colors"
              style={{ color: tab === 'upcoming' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => onTabChange('history')}
              className="font-mono text-[10px] uppercase tracking-[0.25em] transition-colors"
              style={{ color: tab === 'history' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}
            >
              History
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-600 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <span>close</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto chat-panel-scroll" style={{ padding: '20px 24px 32px' }}>
          {tab === 'upcoming' && (
            <div className="space-y-6">
              {upcomingByPhase.length === 0 && (
                <p className="font-mono text-[11px] text-zinc-600">No pending tasks.</p>
              )}
              {upcomingByPhase.map(group => (
                <div key={group.phase}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-zinc-600 mb-3">
                    {group.label}
                  </p>
                  <div>
                    {group.tasks.map(task => (
                      <div key={task.id} className="border-b border-white/[0.04] last:border-b-0">
                        <div
                          className="flex items-center justify-between py-3 cursor-pointer group"
                          onClick={() => onTaskExpand(task.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                            <span className="font-mono text-[12px] text-zinc-400 group-hover:text-zinc-200 transition-colors leading-snug">
                              {task.title}
                            </span>
                          </div>
                          <span
                            className="font-mono text-[10px] text-zinc-700 shrink-0 ml-3"
                            style={{
                              display: 'inline-block',
                              transition: 'transform 0.2s',
                              transform: expandedTaskId === task.id ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}
                          >
                            ›
                          </span>
                        </div>
                        {expandedTaskId === task.id && (
                          <div style={{ paddingBottom: '12px' }}>
                            {loadingBriefId === task.id ? (
                              <p className="font-mono text-[11px] text-zinc-600 animate-pulse">Generating brief...</p>
                            ) : (
                              <p className="font-mono text-[12px] text-zinc-500 leading-relaxed whitespace-pre-line">
                                {taskBriefs[task.id] ?? ''}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-6">
              {historyByPhase.length === 0 && (
                <p className="font-mono text-[11px] text-zinc-600">No completed tasks yet.</p>
              )}
              {historyByPhase.map(group => (
                <div key={group.phase}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-zinc-600 mb-3">
                    {group.label}
                  </p>
                  <div>
                    {group.tasks.map(task => (
                      <div key={task.id} className="flex items-start justify-between py-3 border-b border-white/[0.04] last:border-b-0 gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="w-1 h-1 rounded-full shrink-0 mt-1.5"
                            style={{ background: task.status === 'done' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }}
                          />
                          <div className="min-w-0">
                            <span
                              className="font-mono text-[12px] leading-snug block"
                              style={{ color: task.status === 'done' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)' }}
                            >
                              {task.title}
                            </span>
                            {task.deliverableNote && (
                              <span className="font-mono text-[10px] text-zinc-600 mt-1 block truncate">
                                {task.deliverableNote}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className="font-mono text-[9px] uppercase tracking-[0.2em] shrink-0"
                          style={{ color: task.status === 'done' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
                        >
                          {task.status === 'done' ? 'Done' : 'Skipped'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────
export type WorkspaceScreenProps = {
  campaignId: string
  mission: MissionCardData
  chips: WorkspaceChip[]
  workItems: WorkItem[]
  nextTaskId: string | null
  nextTaskTitle: string | null
  allTasks: Array<{
    id: string
    title: string
    phase: string
    milestoneTitle: string | null
    description: string | null
    aiContext: string | null
  }>
  completedTasks: Array<{
    id: string
    title: string
    phase: string
    phaseLabel: string
    status: 'done' | 'skipped'
    deliverableNote: string | null
  }>
}


export function WorkspaceScreen({ campaignId, mission, chips, workItems, nextTaskId, nextTaskTitle, allTasks, completedTasks }: WorkspaceScreenProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<WorkspaceMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(true)
  const [optimisticTitle, setOptimisticTitle] = useState<string | null>(null)
  const [optimisticMilestone, setOptimisticMilestone] = useState<string | null | undefined>(undefined)
  const [optimisticCompleted, setOptimisticCompleted] = useState<number | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [taskBriefs, setTaskBriefs] = useState<Record<string, string>>({})
  const [loadingBriefId, setLoadingBriefId] = useState<string | null>(null)
  const [pendingDeliverableTaskId, setPendingDeliverableTaskId] = useState<string | null>(null)
  const [deliverableInput, setDeliverableInput] = useState('')
  const [taskQueueOpen, setTaskQueueOpen] = useState(false)
  const [taskQueueTab, setTaskQueueTab] = useState<'upcoming' | 'history'>('upcoming')
  const [replanPending, setReplanPending] = useState(false)
  const [replanConfirmed, setReplanConfirmed] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  const displayedTaskId = nextTaskId
  const displayedTitle = optimisticTitle ?? mission.nextMoveText
  const displayedMilestone = optimisticMilestone !== undefined
    ? optimisticMilestone
    : mission.currentMilestoneTitle

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
    if (chip.id === 'replan') {
      setMinimized(false)
      if (!replanPending) {
        setReplanPending(true)
        setMessages(m => [...m, {
          role: 'assistant',
          content: "You've skipped this type of task 3+ times. BLACKBOX can regenerate your remaining plan avoiding those patterns.\n\nThis will replace all pending tasks. Completed and skipped tasks are untouched.\n\n**Confirm to regenerate.**"
        }])
        return
      }
      return
    }
    if (chip.id === 'new_campaign') {
      window.location.href = '/onboarding'
      return
    }
    setMinimized(false)
    sendMessage(chip.prompt)
  }

  async function handleTaskAction(status: 'done' | 'skipped') {
    if (!nextTaskId || !nextTaskTitle) return

    const currentIdx = allTasks.findIndex(t => t.id === nextTaskId)
    const next = allTasks[currentIdx + 1] ?? null

    if (next) {
      setOptimisticTitle(next.title)
      setOptimisticMilestone(next.milestoneTitle)
    }
    setOptimisticCompleted((mission.completedTasks ?? 0) + 1)

    try {
      await completeTask(nextTaskId, nextTaskTitle, status)
      if (status === 'done') {
        setPendingDeliverableTaskId(nextTaskId)
      }
      router.refresh()
    } catch {
      setOptimisticTitle(null)
      setOptimisticMilestone(undefined)
      setOptimisticCompleted(null)
    }
  }

  useEffect(() => {
    setOptimisticTitle(null)
    setOptimisticMilestone(undefined)
    setOptimisticCompleted(null)
  }, [nextTaskId])

  async function handleSaveDeliverable() {
    if (!pendingDeliverableTaskId || !deliverableInput.trim()) {
      setPendingDeliverableTaskId(null)
      setDeliverableInput('')
      return
    }
    try {
      await saveTaskDeliverable(pendingDeliverableTaskId, deliverableInput.trim())
    } catch {
      // silent — deliverable is optional, don't block the user
    } finally {
      setPendingDeliverableTaskId(null)
      setDeliverableInput('')
    }
  }

  async function handleTaskExpand(taskId: string) {
    if (expandedTaskId === taskId) { setExpandedTaskId(null); return }
    setExpandedTaskId(taskId)
    if (taskBriefs[taskId]) return
    const task = allTasks.find(t => t.id === taskId)
    if (task?.aiContext) {
      setTaskBriefs(prev => ({ ...prev, [taskId]: task.aiContext! }))
      return
    }
    setLoadingBriefId(taskId)
    try {
      const brief = await generateTaskBrief(taskId, campaignId)
      setTaskBriefs(prev => ({ ...prev, [taskId]: brief }))
    } catch {
      setTaskBriefs(prev => ({ ...prev, [taskId]: 'Could not load brief.' }))
    } finally {
      setLoadingBriefId(null)
    }
  }

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    const t = setTimeout(() => {
      el.scrollTop = el.scrollHeight
    }, 50)
    return () => clearTimeout(t)
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

            <main className="flex flex-col items-center w-full">
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 50, delay: 0 }}
              >
                <MissionCard
                  mission={mission}
                  overrideText={optimisticTitle}
                  overrideMilestone={optimisticMilestone}
                  overrideCompleted={optimisticCompleted}
                  hasTask={!!nextTaskId && !mission.isComplete}
                  onTaskLogOpen={() => setTaskQueueOpen(true)}
                  guideContent={taskBriefs[nextTaskId ?? ''] ?? null}
                  guideLoading={loadingBriefId === nextTaskId}
                  onGuideRequest={() => {
                    if (!nextTaskId) return
                    if (taskBriefs[nextTaskId]) return
                    const task = allTasks.find(t => t.id === nextTaskId)
                    if (task?.aiContext) {
                      setTaskBriefs(prev => ({ ...prev, [nextTaskId]: task.aiContext! }))
                      return
                    }
                    setLoadingBriefId(nextTaskId)
                    generateTaskBrief(nextTaskId, campaignId)
                      .then(brief => setTaskBriefs(prev => ({ ...prev, [nextTaskId]: brief })))
                      .catch(() => setTaskBriefs(prev => ({ ...prev, [nextTaskId]: 'Could not load guide.' })))
                      .finally(() => setLoadingBriefId(null))
                  }}
                />
                {displayedTaskId && !mission.isComplete && (
                  <TaskActions
                    onDone={() => handleTaskAction('done')}
                    onSkip={() => handleTaskAction('skipped')}
                    disabled={false}
                  />
                )}
                <AnimatePresence>
                  {pendingDeliverableTaskId && (
                    <motion.div
                      className="max-w-[600px] mx-auto mt-2 px-1"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <div
                        className="w-full px-4 py-3 flex items-center gap-2"
                        style={{
                          background: '#111113',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '4px',
                        }}
                      >
                        <input
                          type="text"
                          value={deliverableInput}
                          onChange={(e) => setDeliverableInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveDeliverable()
                            if (e.key === 'Escape') {
                              setPendingDeliverableTaskId(null)
                              setDeliverableInput('')
                            }
                          }}
                          placeholder="Add a link or note (optional)"
                          autoFocus
                          className="flex-1 min-w-0 bg-transparent outline-none font-mono text-[12px] text-zinc-300 placeholder:text-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={handleSaveDeliverable}
                          className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                        >
                          {deliverableInput.trim() ? 'Save' : 'Skip'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 50, delay: 0.04 }}
              >
                <WorkCard workItems={workItems} campaignId={campaignId} />
              </motion.div>
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 50, delay: 0.08 }}
              >
                <ActionChips chips={chips} onAction={handleChipAction} disabled={loading} />
              </motion.div>
            </main>
          </div>
        </div>
      </div>

      {/* Minimized input bar — always visible at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 md:px-10" style={{ paddingBottom: '24px' }}>
        <motion.div
          className="w-full max-w-[600px] flex items-center gap-2 px-4"
          style={{
            height: '48px',
            background: '#111113',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '4px',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40, delay: 0.15 }}
        >
          {messages.length > 0 && (
            <motion.button
              type="button"
              onClick={() => setMinimized(false)}
              className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 rounded"
              aria-label="Expand chat"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            onFocus={() => { if (messages.length > 0) setMinimized(false) }}
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
                onClick={() => { sendMessage(input); setMinimized(false) }}
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
      </div>

      {/* Drawer — renders as fixed overlay when open */}
      <AnimatePresence>
        {!minimized && (
          <AIDrawer
            messages={messages}
            loading={loading}
            onClose={() => setMinimized(true)}
            threadRef={threadRef}
            replanPending={replanPending}
            onConfirmReplan={async () => {
              setReplanPending(false)
              setReplanConfirmed(true)
              setLoading(true)
              try {
                await replanCampaign(campaignId)
                router.refresh()
                setMessages(m => [...m, { role: 'assistant', content: 'Plan updated. Patterns you skipped have been removed.' }])
              } catch {
                setMessages(m => [...m, { role: 'assistant', content: 'Replan failed. Try again.' }])
              } finally {
                setLoading(false)
                setReplanConfirmed(false)
              }
            }}
          />
        )}
        {taskQueueOpen && (
          <TaskQueueDrawer
            allTasks={allTasks}
            completedTasks={completedTasks}
            tab={taskQueueTab}
            onTabChange={setTaskQueueTab}
            onClose={() => setTaskQueueOpen(false)}
            expandedTaskId={expandedTaskId}
            taskBriefs={taskBriefs}
            loadingBriefId={loadingBriefId}
            onTaskExpand={handleTaskExpand}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
