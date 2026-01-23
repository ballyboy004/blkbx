'use client'

import { useState } from 'react'
import { TaskGuideModal } from "@/components/dashboard/TaskGuideModal"
import { completeTask, skipTask } from '@/app/dashboard/actions/tasks'
import type { PriorityTask } from '@/lib/intelligence/interpret'

// Typography constants
const bodyText = "font-mono text-[13px] font-normal tracking-normal leading-[1.7] text-zinc-300"
const labelStyle = "font-mono text-[12px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-2"
const headerStyle = "font-mono text-[13px] font-semibold tracking-[0.2em] uppercase text-zinc-500"

interface TodayCardProps {
  task: PriorityTask
}

export default function TodayCard({ task: initialTask }: TodayCardProps) {
  const [task, setTask] = useState<PriorityTask | null>(initialTask)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  
  const [showReflection, setShowReflection] = useState(false)
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoading = isSkipping || isRefreshing || isSubmitting
  const charLimit = 280

  const cardStyle = {
    background: 'rgba(26, 26, 26, 0.4)',
    backdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '4px',
    boxShadow: '0 9px 24px rgba(0, 0, 0, 0.5)'
  }

  async function fetchNewTask() {
    setIsRefreshing(true)
    setFetchError(false)
    
    try {
      const response = await fetch('/api/intelligence/refresh', {
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.task) {
        setTask(data.task)
      } else {
        console.error('[TodayCard] Failed to fetch new task:', data.error)
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

  async function handleSkipReflection() {
    if (isSubmitting || !task) return
    setIsSubmitting(true)

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

  // Error state - show retry button
  if (fetchError) {
    return (
      <div className="p-10 transition-all duration-300" style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-4">
          <p className="font-mono text-[12px] text-zinc-400">
            Couldn't generate task
          </p>
          <button
            onClick={fetchNewTask}
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
      <div className="p-10 transition-all duration-300" style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-3">
          <p className="font-mono text-[13px] font-semibold text-white">✓ Done</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">
            Generating next task...
          </p>
        </div>
      </div>
    )
  }

  // Refreshing state
  if (isRefreshing) {
    return (
      <div className="p-10 transition-all duration-300" style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
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
      <div className="p-10 transition-all duration-300" style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
        <div className="py-12 text-center space-y-4">
          <p className="font-mono text-[12px] text-zinc-400">
            No task available
          </p>
          <button
            onClick={fetchNewTask}
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
      <div className="p-10 transition-all duration-300" style={cardStyle}>
        <h2 className={`${headerStyle} mb-6`}>Today</h2>
        
        <div className="space-y-5">
          <p className="font-mono text-[13px] font-semibold text-white">✓ {task.title}</p>
          
          <div className="space-y-3">
            <label className={labelStyle}>Quick Note (Optional)</label>
            
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value.slice(0, charLimit))}
              placeholder="What worked? What didn't?"
              disabled={isSubmitting}
              className="w-full h-24 bg-zinc-900/50 border border-zinc-700/50 rounded px-3 py-2 font-mono text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none transition-colors disabled:opacity-50"
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
      className="p-10 space-y-5 transition-all duration-300 group"
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
        <h2 className={headerStyle}>Today</h2>
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

      <div className="space-y-5">
        {/* Task title with guide modal */}
        <div>
          <span className={labelStyle}>Task</span>
          <TaskGuideModal task={task} />
        </div>

        {/* Why this task */}
        <div>
          <span className={labelStyle}>Why</span>
          <p className={bodyText}>{task.reasoning}</p>
        </div>

        {/* Guardrail */}
        <div>
          <span className={labelStyle}>Guardrail</span>
          <p className={bodyText}>{task.guardrail}</p>
        </div>
      </div>
    </div>
  )
}
