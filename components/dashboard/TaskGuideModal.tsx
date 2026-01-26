"use client"

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { PriorityTask } from '@/lib/intelligence/interpret'

type TaskGuideModalProps = {
  task: PriorityTask
  isHero?: boolean
}

// Typography constants
const bodyText = "font-mono text-[13px] font-normal tracking-normal leading-[1.7] text-zinc-300"
const labelStyle = "font-mono text-[12px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-2"

export function TaskGuideModal({ task, isHero = false }: TaskGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Safety check - if no guide, don't render interactive modal
  if (!task.guide) {
    return (
      <p className="font-mono text-[13px] font-semibold text-white">
        {task.title}
      </p>
    )
  }

  return (
    <>
      {/* Clickable task title */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-left w-full group"
      >
        <p className="font-mono text-[13px] font-semibold text-white group-hover:underline decoration-zinc-600 underline-offset-4 transition-all duration-150">
          {task.title}
        </p>
      </button>

      {/* Modal overlay */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal content */}
          <div
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0">
              <h2 className="font-mono text-[14px] font-semibold text-white flex-1 pr-2">
                {task.title}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* What */}
              <div className="space-y-2">
                <h3 className={labelStyle}>What You're Doing</h3>
                <p className={bodyText}>{task.guide.what}</p>
              </div>

              {/* How */}
              <div className="space-y-3">
                <h3 className={labelStyle}>How To Do It</h3>
                <ol className="space-y-3">
                  {task.guide.how.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-semibold text-zinc-400">
                        {i + 1}
                      </span>
                      <p className={`${bodyText} pt-0.5`}>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Why */}
              <div className="space-y-2">
                <h3 className={labelStyle}>Why This Works For You</h3>
                <p className={bodyText}>{task.guide.why}</p>
              </div>

              {/* Guardrail */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
                  <span className={labelStyle}>Guardrail</span>
                  <p className={`${bodyText} text-zinc-400`}>{task.guardrail}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-zinc-800 flex-shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
