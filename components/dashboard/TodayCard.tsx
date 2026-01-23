'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TaskGuideModal } from "@/components/dashboard/TaskGuideModal"
import { completeTask, skipTask } from '@/app/dashboard/actions/tasks'
import type { PriorityTask } from '@/lib/intelligence/interpret'

// Body text: clean, readable
const bodyText = "font-mono text-[14px] font-normal tracking-normal leading-[1.7] text-zinc-300"

// Labels: bolder, larger than body
const labelStyle = "font-mono text-[12px] font-bold tracking-[0.2em] uppercase text-zinc-500 block mb-2"

// Card headers
const headerStyle = "font-mono text-[13px] font-bold tracking-[0.2em] uppercase text-zinc-500"

type RecentTask = {
  id: string
  title: string
  status: 'done' | 'skipped'
  created_at: string
  reflection?: string
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
  
  // Guide modal state for reflection page
  const [showGuideModal, setShowGuideModal] = useState(false)
  
  // Recent tasks visibility
  const [showRecentTasks, setShowRecentTasks] = useState(false)
  
  // Store last reflection to pass with refresh request
  const lastReflectionRef = useRef<string>('')
  
  // Track if prefetch has been triggered for current task
  const prefetchTriggeredRef = useRef<string | null>(null)

  const isLoading = isSkipping || isRefreshing || isSubmitting
  const charLimit = 280

  // Trigger prefetch when task is displayed
  useEffect(() => {
    if (task?.title && prefetchTriggeredRef.current !== task.title) {
      prefetchTriggeredRef.current = task.title
      
      // Trigger prefetch in background (fire and forget)
      fetch('/api/intelligence/prefetch', { method: 'POST' })
        .then(() => console.log('[TodayCard] Prefetch triggered'))
        .catch(err => console.log('[TodayCard] Prefetch failed (non-blocking):', err))
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
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.task && data.task.title) {
        setTask(data.task)
        if (data.source === 'prefetch') {
          console.log('[TodayCard] Used prefetched task - instant!')
        }
      } else {
        console.error('[TodayCard] Invalid task response:', data)
        setFetchError(true)
      }
    } catch (error) {
      console.error('[TodayCard] Fetch error:', error)
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
        {
          title: task.title,
          reasoning: task.reasoning,
          guardrail: task.guardrail,
        },
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
        console.error('[TodayCard] Complete failed:', result.error)
        alert('Failed to complete task. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('[TodayCard] Complete error:', error)
      alert('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  async function handleSkipReflection() {
    if (isSubmitting || !task) return
    setIsSubmitting(true)
    lastReflectionRef.current = ''

    try {
      const result = await completeTask({
        title: task.title,
        reasoning: task.reasoning,
        guardrail: task.guardrail,
      })

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
        console.error('[TodayCard] Complete failed:', result.error)
        alert('Failed to complete task. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('[TodayCard] Complete error:', error)
      alert('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  async function handleSkip() {
    if (isLoading || !task) return
    setIsSkipping(true)

    try {
      const result = await skipTask({
        title: task.title,
        reasoning: task.reasoning,
        guardrail: task.guardrail,
      })

      if (result.success) {
        setIsSkipping(false)
        await fetchNewTask()
      } else {
        console.error('[TodayCard] Skip failed:', result.error)
        alert('Failed to skip task. Please try again.')
        setIsSkipping(false)
      }
    } catch (error) {
      console.error('[TodayCard] Skip error:', error)
      alert('An error occurred. Please try again.')
      setIsSkipping(false)
    }
  }

  const cardStyle = {
    background: 'rgba(26, 26, 26, 0.4)',
    backdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '4px',
    boxShadow: '0 9px 24px rgba(0, 0, 0, 0.5)'
  }

  const containerPadding = isHero ? "p-10" : "p-8"
  const titleStyle = headerStyle
  const heroBodyText = bodyText
  const heroLabelStyle = labelStyle
  const heroSpacing = "space-y-5"

  // Guide Modal for reflection page
  const GuideModal = () => {
    if (!showGuideModal || !task?.guide) return null
    
    return typeof document !== 'undefined' ? createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setShowGuideModal(false)}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-6 border-b border-zinc-800">
            <h2 className="font-mono text-[14px] font-semibold text-white">{task.title}</h2>
            <button onClick={() => setShowGuideModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className={labelStyle}>What You're Doing</h3>
              <p className={bodyText}>{task.guide.what}</p>
            </div>
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
            <div className="space-y-2">
              <h3 className={labelStyle}>Why This Works For You</h3>
              <p className={bodyText}>{task.guide.why}</p>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
                <span className={labelStyle}>Guardrail</span>
                <p className={`${bodyText} text-zinc-400`}>{task.guardrail}</p>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-zinc-800">
            <button onClick={() => setShowGuideModal(false)} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    ) : null
  }

  // Error state
  if (fetchError) {
    return (
      <div className={`${containerPadding} transition-all duration-300`} style={cardStyle}>
        <h2 className={`${titleStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-4">
          <p className="font-mono text-[12px] text-zinc-400">Could not generate task</p>
          <button onClick={() => fetchNewTask()} className="px-4 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white hover:bg-zinc-700/50 hover:border-zinc-500 transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (showSuccess) {
    return (
      <div className={`${containerPadding} space-y-4 transition-all duration-300`} style={cardStyle}>
        <h2 className={`${titleStyle} mb-6`}>Today</h2>
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
      <div className={`${containerPadding} space-y-4 transition-all duration-300`} style={cardStyle}>
        <h2 className={`${titleStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.15em] text-zinc-400 animate-pulse">Thinking...</p>
        </div>
      </div>
    )
  }

  // No task state
  if (!task) {
    return (
      <div className={`${containerPadding} transition-all duration-300`} style={cardStyle}>
        <h2 className={`${titleStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-4">
          <p className="font-mono text-[12px] text-zinc-400">No task available</p>
          <button onClick={() => fetchNewTask()} className="px-4 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white hover:bg-zinc-700/50 hover:border-zinc-500 transition-colors">
            Generate Task
          </button>
        </div>
      </div>
    )
  }

  // Reflection capture state
  if (showReflection) {
    return (
      <div className={`${containerPadding} transition-all duration-300`} style={cardStyle}>
        <GuideModal />
        <h2 className={`${titleStyle} mb-6`}>Today</h2>
        
        <div className={heroSpacing}>
          {/* Task title with view guide link */}
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[14px] font-semibold text-white">✓ {task.title}</p>
            {task.guide && (
              <button
                onClick={() => setShowGuideModal(true)}
                className="flex-shrink-0 font-mono text-[10px] tracking-[0.1em] uppercase text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
              >
                View Guide
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            <label className={heroLabelStyle}>Quick Note (Optional)</label>
            
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value.slice(0, charLimit))}
              placeholder="What worked? What didn't?"
              disabled={isSubmitting}
              className="w-full h-24 bg-zinc-900/50 border border-zinc-700/50 rounded px-3 py-2 font-mono text-[14px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none transition-colors disabled:opacity-50"
            />
            
            <p className="font-mono text-[10px] tracking-[0.1em] text-zinc-600 text-right">
              {reflection.length}/{charLimit}
            </p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSkipReflection}
              disabled={isSubmitting}
              className="flex-1 py-2 bg-transparent border border-zinc-700/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '...' : 'Skip'}
            </button>
            
            <button
              onClick={handleCompleteWithReflection}
              disabled={isSubmitting}
              className="flex-1 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white hover:bg-zinc-700/50 hover:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '...' : 'Save'}
            </button>
          </div>

          {/* Recent Tasks (collapsible) */}
          {recentTasks.length > 0 && (
            <div className="pt-4 border-t border-zinc-800/50">
              <button
                onClick={() => setShowRecentTasks(!showRecentTasks)}
                className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                <svg 
                  className={`w-3 h-3 transition-transform ${showRecentTasks ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Recent Tasks ({recentTasks.length})
              </button>
              
              {showRecentTasks && (
                <div className="mt-3 space-y-2">
                  {recentTasks.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-start gap-2 text-zinc-500">
                      <span className="font-mono text-[11px]">
                        {t.status === 'done' ? '✓' : '→'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[12px] text-zinc-400 truncate">{t.title}</p>
                        {t.reflection && (
                          <p className="font-mono text-[10px] text-zinc-600 truncate mt-0.5">"{t.reflection}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default task view
  return (
    <div 
      className={`${containerPadding} ${heroSpacing} transition-all duration-300 group`}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(36, 39, 49, 0.5)'
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.8)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(26, 26, 26, 0.4)'
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
        e.currentTarget.style.boxShadow = '0 9px 24px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header with action buttons */}
      <div className="flex justify-between items-start mb-6">
        <h2 className={`${titleStyle}`}>Today</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="bg-transparent border border-white/30 rounded-sm font-mono font-medium uppercase transition-all duration-[120ms] hover:bg-white/10 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[9px] px-2 py-0.5 tracking-[0.12em]"
          >
            {isSkipping ? '...' : 'Skip'}
          </button>
          <button
            onClick={handleDoneClick}
            disabled={isLoading}
            className="bg-transparent border border-white/30 rounded-sm font-mono font-medium uppercase transition-all duration-[120ms] hover:bg-white/15 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[9px] px-2 py-0.5 tracking-[0.12em]"
          >
            Done
          </button>
        </div>
      </div>

      <div className={heroSpacing}>
        {/* Task title with guide modal */}
        <div>
          <span className={heroLabelStyle}>Task</span>
          <TaskGuideModal task={task} isHero={isHero} />
        </div>

        {/* Why this task */}
        <div>
          <span className={heroLabelStyle}>Why</span>
          <p className={heroBodyText}>{task.reasoning || 'No reasoning available'}</p>
        </div>

        {/* Guardrail */}
        <div>
          <span className={heroLabelStyle}>Guardrail</span>
          <p className={heroBodyText}>{task.guardrail || 'Take your time'}</p>
        </div>

        {/* Recent Tasks (collapsible) */}
        {recentTasks.length > 0 && (
          <div className="pt-4 border-t border-zinc-800/50">
            <button
              onClick={() => setShowRecentTasks(!showRecentTasks)}
              className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              <svg 
                className={`w-3 h-3 transition-transform ${showRecentTasks ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Recent Tasks ({recentTasks.length})
            </button>
            
            {showRecentTasks && (
              <div className="mt-3 space-y-2">
                {recentTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-start gap-2 text-zinc-500">
                    <span className="font-mono text-[11px]">
                      {t.status === 'done' ? '✓' : '→'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[12px] text-zinc-400 truncate">{t.title}</p>
                      {t.reflection && (
                        <p className="font-mono text-[10px] text-zinc-600 truncate mt-0.5">"{t.reflection}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
