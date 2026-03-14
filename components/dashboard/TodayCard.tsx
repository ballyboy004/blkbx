'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TaskGuideModal } from "@/components/dashboard/TaskGuideModal"
import { completeTask, skipTask } from '@/app/dashboard/actions/tasks'
import type { PriorityTask } from '@/lib/intelligence/interpret'
import { components, typography, buttonClass, pillClass } from '@/lib/design-system'

type RecentTask = {
  id: string
  title: string
  status: 'done' | 'skipped'
  created_at: string
  reflection?: string
  reasoning?: string
  guardrail?: string
}

interface TodayCardProps {
  task: PriorityTask
  isHero?: boolean
  recentTasks?: RecentTask[]
}

export default function TodayCard({ task: initialTask, isHero = false, recentTasks = [] }: TodayCardProps) {
  const [task, setTask] = useState<PriorityTask | null>(initialTask)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Modal states
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const [selectedPastTask, setSelectedPastTask] = useState<RecentTask | null>(null)
  const [showSkipReasonModal, setShowSkipReasonModal] = useState(false)
  const [skipReason, setSkipReason] = useState<string>('')
  
  const prefetchTriggeredRef = useRef<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isLoading = isSkipping || isRefreshing || isSubmitting

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false)
      }
    }
    if (showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHistoryDropdown])

  // Prefetch
  useEffect(() => {
    if (task?.title && prefetchTriggeredRef.current !== task.title) {
      prefetchTriggeredRef.current = task.title
      fetch('/api/intelligence/prefetch', { method: 'POST' }).catch(() => {})
    }
  }, [task?.title])

  async function fetchNewTask(withReflection?: string) {
    setIsRefreshing(true)
    setFetchError(false)
    try {
      const url = withReflection 
        ? `/api/intelligence/refresh?reflection=${encodeURIComponent(withReflection)}`
        : '/api/intelligence/refresh'
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data.success && data.task?.title) {
        setTask(data.task)
      } else {
        setFetchError(true)
      }
    } catch {
      setFetchError(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleDoneClick() {
    if (isLoading || !task) return
    setIsSubmitting(true)
    try {
      const result = await completeTask({ title: task.title, reasoning: task.reasoning, guardrail: task.guardrail })
      if (result.success) {
        setShowSuccess(true)
        setIsSubmitting(false)
        setTimeout(async () => {
          setShowSuccess(false)
          await fetchNewTask()
        }, 1200)
      } else {
        alert('Failed to complete task.')
        setIsSubmitting(false)
      }
    } catch {
      alert('An error occurred.')
      setIsSubmitting(false)
    }
  }

  function handleSkipClick() {
    if (isLoading || !task) return
    setSkipReason('')
    setShowSkipReasonModal(true)
  }

  async function handleSkipConfirm() {
    if (!task || !skipReason) return
    setIsSkipping(true)
    setShowSkipReasonModal(false)
    try {
      const result = await skipTask(
        { title: task.title, reasoning: task.reasoning, guardrail: task.guardrail },
        skipReason
      )
      if (result.success) {
        setIsSkipping(false)
        await fetchNewTask()
      } else {
        alert('Failed to skip task.')
        setIsSkipping(false)
      }
    } catch {
      alert('An error occurred.')
      setIsSkipping(false)
    }
  }

  const containerPadding = isHero ? "p-6 sm:p-8 md:p-10" : "p-6 sm:p-8"

  // Past Task Detail Modal
  const PastTaskModal = () => {
    if (!selectedPastTask) return null
    return typeof document !== 'undefined' ? createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedPastTask(null)}>
        <div className="absolute inset-0 bg-black/95" />
        <div style={components.overlay.modal} className="relative w-full max-w-lg mx-4 sm:mx-0 rounded-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`font-mono text-[11px] flex-shrink-0 ${selectedPastTask.status === 'done' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {selectedPastTask.status === 'done' ? '✓' : '→'}
              </span>
              <h2 className="font-mono text-[13px] font-semibold text-white truncate">{selectedPastTask.title}</h2>
            </div>
            <button 
              onClick={() => setSelectedPastTask(null)} 
              className="btn-recess text-zinc-500 flex-shrink-0 ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {selectedPastTask.reasoning && (
              <div>
                <span className={`${typography.label} block mb-2`}>Why</span>
                <p className={typography.body}>{selectedPastTask.reasoning}</p>
              </div>
            )}
            {selectedPastTask.guardrail && (
              <div>
                <span className={`${typography.label} block mb-2`}>Guardrail</span>
                <p className={typography.body}>{selectedPastTask.guardrail}</p>
              </div>
            )}
            {selectedPastTask.reflection && (
              <div>
                <span className={`${typography.label} block mb-2`}>Your Note</span>
                <p className="font-mono text-[13px] text-zinc-400 italic">"{selectedPastTask.reflection}"</p>
              </div>
            )}
            {!selectedPastTask.reasoning && !selectedPastTask.guardrail && !selectedPastTask.reflection && (
              <p className="font-mono text-[12px] text-zinc-500">No additional details available</p>
            )}
          </div>
        </div>
      </div>,
      document.body
    ) : null
  }

  // Current Task Guide Modal
  const GuideModal = () => {
    if (!showGuideModal || !task?.guide) return null
    return typeof document !== 'undefined' ? createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowGuideModal(false)}>
        <div className="absolute inset-0 bg-black/95" />
        <div style={components.overlay.modal} className="relative w-full max-w-2xl mx-4 sm:mx-0 rounded-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0">
            <h2 className="font-mono text-[14px] font-semibold text-white flex-1 pr-2">{task.title}</h2>
            <button 
              onClick={() => setShowGuideModal(false)} 
              className="btn-recess text-zinc-500 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            <div><h3 className={`${typography.label} block mb-2`}>What You're Doing</h3><p className={typography.body}>{task.guide.what}</p></div>
            <div className="space-y-3">
              <h3 className={`${typography.label} block mb-2`}>How To Do It</h3>
              <ol className="space-y-3">
                {task.guide.how.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-semibold text-zinc-400">{i + 1}</span>
                    <p className={`${typography.body} pt-0.5`}>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div><h3 className={`${typography.label} block mb-2`}>Why This Works For You</h3><p className={typography.body}>{task.guide.why}</p></div>
          </div>
          <div className="p-4 sm:p-6 border-t border-zinc-800 flex-shrink-0">
            <button 
              onClick={() => setShowGuideModal(false)} 
              className="btn-recess w-full py-3 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    ) : null
  }

  const SKIP_REASON_OPTIONS = [
    'Not relevant right now',
    'Too big / need to break down',
    'Already doing this',
    "Don't understand it",
    'Not feeling it today',
  ]

  // Skip reason modal (styling from EditProfileModal)
  const SkipReasonModal = () => {
    if (!showSkipReasonModal) return null
    return typeof document !== 'undefined' ? createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={() => setShowSkipReasonModal(false)}
      >
        <div className="fixed inset-0 bg-black/95" />
        <div
          style={components.overlay.modal}
          className="relative w-full max-w-2xl mx-4 sm:mx-0 my-4 sm:my-8 rounded-lg animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0">
            <h2 className={typography.label}>WHY SKIP?</h2>
            <button
              onClick={() => setShowSkipReasonModal(false)}
              className="btn-recess text-zinc-500 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            <div className="space-y-2">
              <label className={typography.label}>WHY SKIP?</label>
              <div className="flex flex-wrap gap-2">
                {SKIP_REASON_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSkipReason(option)}
                    className={pillClass(skipReason === option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 p-4 sm:p-6 border-t border-zinc-800 flex-shrink-0">
            <button
              onClick={() => setShowSkipReasonModal(false)}
              className={`flex-1 ${buttonClass.secondary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSkipConfirm}
              disabled={!skipReason}
              className={`flex-1 ${buttonClass.primary}`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>,
      document.body
    ) : null
  }

  // History Dropdown - compact, scrollable
  const HistoryDropdown = () => {
    if (!showHistoryDropdown) return null
    return (
      <div 
        ref={dropdownRef}
        style={components.overlay.dropdown}
        className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[calc(100vw-1rem)] sm:w-80 max-w-[320px] rounded z-50"
      >
        <div className="p-2 border-b border-zinc-800">
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-zinc-500">
            Task History
          </span>
        </div>
        {recentTasks.length === 0 ? (
          <div className="p-4 text-center">
            <p className="font-mono text-[11px] text-zinc-500">No history yet</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            {recentTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedPastTask(t); setShowHistoryDropdown(false) }}
                className="w-full text-left px-3 py-3 hover:bg-zinc-800/80 transition-colors flex items-start gap-2 min-h-[44px]"
              >
                <span className={`font-mono text-[10px] mt-0.5 flex-shrink-0 ${t.status === 'done' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                  {t.status === 'done' ? '✓' : '→'}
                </span>
                <span className="font-mono text-[11px] text-zinc-300 line-clamp-1">{t.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <div className={`${containerPadding}`} style={components.card.hero}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={typography.cardHeader}>Today</h2>
        </div>
        <div className="py-8 space-y-4 text-center">
          <p className={typography.body}>Couldn't load task</p>
          <p className="font-mono text-[12px] text-zinc-500 mb-4">
            Something went wrong. Try again.
          </p>
          <button 
            onClick={() => fetchNewTask()} 
            className={buttonClass.secondary}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (showSuccess) {
    return (
      <div className={`${containerPadding}`} style={components.card.hero}>
        <h2 className={`${typography.cardHeader} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-3">
          <p className="font-mono text-[14px] font-semibold text-white">✓ Done</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">Loading next task...</p>
        </div>
      </div>
    )
  }

  // Refreshing state
  if (isRefreshing) {
    return (
      <div className={`${containerPadding}`} style={components.card.hero}>
        <h2 className={`${typography.cardHeader} mb-6`}>Today</h2>
        <div className="py-12 text-center">
          <p className="font-mono text-[12px] text-zinc-400 animate-pulse lowercase">thinking...</p>
        </div>
      </div>
    )
  }

  // No task state
  if (!task) {
    return (
      <div className={`${containerPadding}`} style={components.card.hero}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={typography.cardHeader}>Today</h2>
        </div>
        <div className="py-8 space-y-4 text-center">
          <p className={typography.body}>No task right now</p>
          <p className="font-mono text-[12px] text-zinc-500">
            BLACKBOX generates tasks based on your profile and patterns.
            <br />
            Complete your profile or check back soon.
          </p>
        </div>
      </div>
    )
  }

  // Default task view
  return (
    <div className={`${containerPadding} space-y-5 transition-all duration-300 group today-card`} style={components.card.hero}>
      <PastTaskModal />
        <SkipReasonModal />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className={typography.cardHeader}>Today</h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className={buttonClass.ghost}
            >
              History
            </button>
            <HistoryDropdown />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleSkipClick}
              disabled={isLoading}
              className={buttonClass.secondary}
            >
              {isSkipping ? '...' : 'Skip'}
            </button>
            <button
              onClick={handleDoneClick}
              disabled={isLoading || isSubmitting}
              className={buttonClass.primary}
            >
              {isSubmitting ? '...' : 'Done'}
            </button>
          </div>
        </div>
      </div>

      {/* Task */}
      <div>
        <span className={`${typography.label} block mb-2`}>Task</span>
        <TaskGuideModal task={task} isHero={isHero} />
      </div>

      {/* Why */}
      <div>
        <span className={`${typography.label} block mb-2`}>Why</span>
        <p className={typography.body}>{task.reasoning || 'No reasoning available'}</p>
      </div>

      {/* Guardrail */}
      <div>
        <span className={`${typography.label} block mb-2`}>Guardrail</span>
        <p className={typography.body}>{task.guardrail || 'Take your time'}</p>
      </div>
    </div>
  )
}
