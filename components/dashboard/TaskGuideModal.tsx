"use client"

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { PriorityTask } from '@/lib/intelligence/interpret'
import { components, typography, buttonClass } from '@/lib/design-system'

type TaskGuideModalProps = {
  task: PriorityTask
  isHero?: boolean
}

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
        className="text-left w-full min-h-[44px] flex items-center rounded px-1 -mx-1"
      >
        <div className="flex items-center gap-2">
          <p className="font-mono text-[18px] font-bold text-white hover:text-zinc-300 transition-colors duration-150 leading-tight">
            {task.title}
          </p>
          <span
            className="font-mono text-[9px] tracking-wider uppercase text-zinc-500 rounded inline-flex items-center justify-center"
            style={{
              border: '1px solid rgba(63, 63, 70, 1)',
              padding: '2px 6px',
              lineHeight: 1,
            }}
          >
            guide
          </span>
        </div>
      </button>

      {/* Modal overlay */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/95" />

          {/* Modal content */}
          <div
            style={components.overlay.modal}
            className="relative w-full max-w-2xl mx-4 sm:mx-0 my-4 sm:my-8 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0">
              <h2 className="font-mono text-[14px] font-semibold text-white flex-1 pr-2">
                {task.title}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-recess text-zinc-500 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded"
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
                <h3 className={`${typography.label} block mb-2`}>What You're Doing</h3>
                <p className={typography.body}>{task.guide.what}</p>
              </div>

              {/* How */}
              <div className="space-y-3">
                <h3 className={`${typography.label} block mb-2`}>How To Do It</h3>
                <ol className="space-y-3">
                  {task.guide.how.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-semibold text-zinc-400">
                        {i + 1}
                      </span>
                      <p className={`${typography.body} pt-0.5`}>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Why */}
              <div className="space-y-2">
                <h3 className={`${typography.label} block mb-2`}>Why This Works For You</h3>
                <p className={typography.body}>{task.guide.why}</p>
              </div>

              {/* Guardrail */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
                  <span className={`${typography.label} block mb-2`}>Guardrail</span>
                  <p className={`${typography.body} text-zinc-400`}>{task.guardrail}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-zinc-800 flex-shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className={`w-full ${buttonClass.primary}`}
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
