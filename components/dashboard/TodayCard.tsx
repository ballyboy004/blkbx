'use client'

import { useState, useEffect, useRef } from 'react'
import { TaskGuideModal } from "@/components/dashboard/TaskGuideModal"
import { completeTask, skipTask } from '@/app/dashboard/actions/tasks'
import type { PriorityTask } from '@/lib/intelligence/interpret'

// Body text: clean, readable
const bodyText = "font-mono text-[14px] font-normal tracking-normal leading-[1.7] text-zinc-300"

// Labels: bolder, larger than body
const labelStyle = "font-mono text-[12px] font-bold tracking-[0.2em] uppercase text-zinc-500 block mb-2"

// Card headers
const headerStyle = "font-mono text-[13px] font-bold tracking-[0.2em] uppercase text-zinc-500"

interface TodayCardProps {
  task: PriorityTask
  isHero?: boolean
}

export default function TodayCard({ task: initialTask, isHero = false }: TodayCardProps) {
  const [task, setTask] = useState<PriorityTask | null>(initialTask)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  
  const [showReflection, setShowReflection] = useState(false)
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
      // Pass reflection to help decide if prefetch should be used
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
        // Log if we used prefetch
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
    
    // Store reflection for refresh request
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
    
    // No reflection = can use prefetch
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
          await fetchNewTask() // No reflection = use prefetch if available
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
        await fetchNewTask() // Skip = no reflection = use prefetch
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

  // Dynamic styles based on hero mode
  const containerPadding = isHero ? "p-10" : "p-8"
  const titleStyle = headerStyle
  const heroBodyText = bodyText
  const heroLabelStyle = labelStyle
  const heroSpacing = "space-y-5"

  // Error state - show retry button
  if (fetchError) {
    return (
      <div className={`${containerPadding} transition-all duration-300`} style={cardStyle}>
        <h2 className={`${titleStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-4">
          <p className="font-mono text-[12px] text-zinc-400">
            Could not generate task
          </p>
          <button
            onClick={() => fetchNewTask()}
            className="px-4 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white hover:bg-zinc-700/50 hover:border-zinc-500 transition-colors"
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
      <div className={`${containerPadding} space-y-4 transition-all duration-300`} style={cardStyle}>
        <h2 className={`${titleStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-3">
          <p className="font-mono text-[14px] font-semibold text-white">✓ Done</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">
            Loading next task...
          </p>
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
          <p className="font-mono text-[12px] uppercase tracking-[0.15em] text-zinc-400 animate-pulse">
            Thinking...
          </p>
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
          <p className="font-mono text-[12px] text-zinc-400">
            No task available
          </p>
          <button
            onClick={() => fetchNewTask()}
            className="px-4 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white hover:bg-zinc-700/50 hover:border-zinc-500 transition-colors"
          >
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
        <h2 className={`${titleStyle} mb-6`}>Today</h2>
        
        <div className={heroSpacing}>
          <p className="font-mono text-[14px] font-semibold text-white">✓ {task.title}</p>
          
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
      </div>
    </div>
  )
}
