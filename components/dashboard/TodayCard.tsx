'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TaskGuideModal } from "@/components/dashboard/TaskGuideModal"
import { completeTask, skipTask } from '@/app/dashboard/actions/tasks'
import type { PriorityTask } from '@/lib/intelligence/interpret'

// Typography
const bodyText = "font-mono text-[14px] font-normal tracking-normal leading-[1.7] text-zinc-300"
const labelStyle = "font-mono text-[12px] font-bold tracking-[0.2em] uppercase text-zinc-500 block mb-2"
const headerStyle = "font-mono text-[13px] font-bold tracking-[0.2em] uppercase text-zinc-500"

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
  
  const [showReflection, setShowReflection] = useState(false)
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Modal states
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const [selectedPastTask, setSelectedPastTask] = useState<RecentTask | null>(null)
  
  const lastReflectionRef = useRef<string>('')
  const prefetchTriggeredRef = useRef<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isLoading = isSkipping || isRefreshing || isSubmitting
  const charLimit = 280

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

  function handleDoneClick() {
    if (isLoading || !task) return
    setShowReflection(true)
  }

  async function handleCompleteWithReflection() {
    if (isSubmitting || !task) return
    setIsSubmitting(true)
    lastReflectionRef.current = reflection.trim()
    try {
      const result = await completeTask(
        { title: task.title, reasoning: task.reasoning, guardrail: task.guardrail },
        reflection.trim() || undefined
      )
      if (result.success) {
        setShowReflection(false)
        const savedReflection = reflection.trim()
        setReflection('')
        setShowSuccess(true)
        setIsSubmitting(false)
        setTimeout(async () => {
          setShowSuccess(false)
          await fetchNewTask(savedReflection)
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

  async function handleSkipReflection() {
    if (isSubmitting || !task) return
    setIsSubmitting(true)
    lastReflectionRef.current = ''
    try {
      const result = await completeTask({ title: task.title, reasoning: task.reasoning, guardrail: task.guardrail })
      if (result.success) {
        setShowReflection(false)
        setReflection('')
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

  async function handleSkip() {
    if (isLoading || !task) return
    setIsSkipping(true)
    try {
      const result = await skipTask({ title: task.title, reasoning: task.reasoning, guardrail: task.guardrail })
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

  const cardStyle = {
    background: 'rgba(26, 26, 26, 0.4)',
    backdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 16px 32px rgba(0, 0, 0, 0.3)',
    transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
  }

  const containerPadding = isHero ? "p-6 sm:p-8 md:p-10" : "p-6 sm:p-8"

  // Past Task Detail Modal
  const PastTaskModal = () => {
    if (!selectedPastTask) return null
    return typeof document !== 'undefined' ? createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedPastTask(null)}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`font-mono text-[11px] flex-shrink-0 ${selectedPastTask.status === 'done' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {selectedPastTask.status === 'done' ? '✓' : '→'}
              </span>
              <h2 className="font-mono text-[13px] font-semibold text-white truncate">{selectedPastTask.title}</h2>
            </div>
            <button 
              onClick={() => setSelectedPastTask(null)} 
              className="text-zinc-500 hover:text-zinc-300 transition-all flex-shrink-0 ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded"
              style={{
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {selectedPastTask.reasoning && (
              <div>
                <span className={labelStyle}>Why</span>
                <p className={bodyText}>{selectedPastTask.reasoning}</p>
              </div>
            )}
            {selectedPastTask.guardrail && (
              <div>
                <span className={labelStyle}>Guardrail</span>
                <p className={bodyText}>{selectedPastTask.guardrail}</p>
              </div>
            )}
            {selectedPastTask.reflection && (
              <div>
                <span className={labelStyle}>Your Note</span>
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0">
            <h2 className="font-mono text-[14px] font-semibold text-white flex-1 pr-2">{task.title}</h2>
            <button 
              onClick={() => setShowGuideModal(false)} 
              className="text-zinc-500 hover:text-zinc-300 transition-all flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded"
              style={{
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            <div><h3 className={labelStyle}>What You're Doing</h3><p className={bodyText}>{task.guide.what}</p></div>
            <div className="space-y-3">
              <h3 className={labelStyle}>How To Do It</h3>
              <ol className="space-y-3">
                {task.guide.how.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-semibold text-zinc-400">{i + 1}</span>
                    <p className={`${bodyText} pt-0.5`}>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div><h3 className={labelStyle}>Why This Works For You</h3><p className={bodyText}>{task.guide.why}</p></div>
          </div>
          <div className="p-4 sm:p-6 border-t border-zinc-800 flex-shrink-0">
            <button 
              onClick={() => setShowGuideModal(false)} 
              className="w-full py-3 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white transition-all min-h-[44px]"
              style={{
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.8)'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    ) : null
  }

  // History Dropdown - compact, scrollable
  const HistoryDropdown = () => {
    if (!showHistoryDropdown || recentTasks.length === 0) return null
    return (
      <div 
        ref={dropdownRef}
        className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[calc(100vw-1rem)] sm:w-80 max-w-[320px] bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded shadow-2xl z-50"
      >
        <div className="p-2 border-b border-zinc-800">
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-zinc-500">
            Task History
          </span>
        </div>
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
      </div>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <div className={`${containerPadding}`} style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-4">
          <p className="font-mono text-[12px] text-zinc-400">Could not generate task</p>
          <button 
            onClick={() => fetchNewTask()} 
            className="px-4 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white transition-all min-h-[44px]"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
              e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
              e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.5)'
            }}
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
      <div className={`${containerPadding}`} style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
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
      <div className={`${containerPadding}`} style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.15em] text-zinc-400 animate-pulse">Thinking...</p>
        </div>
      </div>
    )
  }

  // No task state
  if (!task) {
    return (
      <div className={`${containerPadding}`} style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-4">
          <p className="font-mono text-[12px] text-zinc-400">No task available</p>
          <button 
            onClick={() => fetchNewTask()} 
            className="px-4 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white transition-all min-h-[44px]"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
              e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
              e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.5)'
            }}
          >
            Generate Task
          </button>
        </div>
      </div>
    )
  }

  // Reflection state
  if (showReflection) {
    return (
      <div className={`${containerPadding}`} style={cardStyle}>
        <GuideModal />
        <PastTaskModal />
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className={headerStyle}>Today</h2>
          <div className="flex items-center gap-4">
            {recentTasks.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                  className="font-mono text-[9px] tracking-[0.12em] uppercase text-zinc-500 hover:text-zinc-300 transition-all px-3 py-2 min-h-[44px]"
                  style={{
                    boxShadow: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                    e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  History
                </button>
                <HistoryDropdown />
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[14px] font-semibold text-white">✓ {task.title}</p>
            {task.guide && (
              <button 
                onClick={() => setShowGuideModal(true)} 
                className="flex-shrink-0 font-mono text-[9px] tracking-[0.1em] uppercase text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-all px-2 py-2 min-h-[44px]"
                style={{
                  boxShadow: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Guide
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <label className={labelStyle}>Quick Note (Optional)</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value.slice(0, charLimit))}
              placeholder="What worked? What didn't?"
              disabled={isSubmitting}
              className="w-full min-h-[100px] sm:h-20 bg-zinc-900/50 border border-zinc-700/50 rounded px-3 py-2 font-mono text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none transition-colors disabled:opacity-50"
            />
            <p className="font-mono text-[9px] tracking-[0.1em] text-zinc-600 text-right">{reflection.length}/{charLimit}</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSkipReflection} 
              disabled={isSubmitting} 
              className="flex-1 py-3 bg-transparent border border-zinc-700/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors disabled:opacity-50 min-h-[44px]"
              style={{
                boxShadow: isSubmitting ? 'none' : 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {isSubmitting ? '...' : 'Skip'}
            </button>
            <button 
              onClick={handleCompleteWithReflection} 
              disabled={isSubmitting} 
              className="flex-1 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white transition-colors disabled:opacity-50 min-h-[44px]"
              style={{
                boxShadow: isSubmitting ? 'none' : 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.5)'
                }
              }}
            >
              {isSubmitting ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default task view
  return (
    <div className={`${containerPadding} space-y-5 transition-all duration-300 group today-card`} style={cardStyle}>
      <PastTaskModal />
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <h2 className={headerStyle}>Today</h2>
        <div className="flex items-center gap-2 sm:gap-4">
          {recentTasks.length > 0 && (
            <div className="relative">
                <button
                  onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                  className="font-mono text-[9px] tracking-[0.12em] uppercase text-zinc-500 hover:text-zinc-300 transition-all px-2 py-2 min-h-[44px]"
                  style={{
                    boxShadow: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                    e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  History
                </button>
              <HistoryDropdown />
            </div>
          )}
          <div className="flex gap-2">
            <button 
              onClick={handleSkip} 
              disabled={isLoading} 
              className="bg-transparent border border-white/30 rounded-sm font-mono font-medium uppercase transition-all disabled:opacity-50 text-white text-[9px] px-3 py-2 tracking-[0.12em] min-h-[44px]"
              style={{
                boxShadow: isLoading ? 'none' : 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                  e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {isSkipping ? '...' : 'Skip'}
            </button>
            <button 
              onClick={handleDoneClick} 
              disabled={isLoading} 
              className="bg-transparent border border-white/30 rounded-sm font-mono font-medium uppercase transition-all disabled:opacity-50 text-white text-[9px] px-3 py-2 tracking-[0.12em] min-h-[44px]"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.2)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Task */}
      <div>
        <span className={labelStyle}>Task</span>
        <TaskGuideModal task={task} isHero={isHero} />
      </div>

      {/* Why */}
      <div>
        <span className={labelStyle}>Why</span>
        <p className={bodyText}>{task.reasoning || 'No reasoning available'}</p>
      </div>

      {/* Guardrail */}
      <div>
        <span className={labelStyle}>Guardrail</span>
        <p className={bodyText}>{task.guardrail || 'Take your time'}</p>
      </div>
    </div>
  )
}
