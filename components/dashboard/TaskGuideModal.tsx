"use client"

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { PriorityTask } from '@/lib/intelligence/interpret'

type TaskGuideModalProps = {
  task: PriorityTask
}

export function TaskGuideModal({ task }: TaskGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Safety check - if no guide, don't render interactive modal
  if (!task.guide) {
    return (
      <p className="font-mono text-[14px] font-normal tracking-wider uppercase text-white">
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
        <p className="font-mono text-[14px] font-normal tracking-wider uppercase text-white group-hover:underline decoration-zinc-600 underline-offset-4 transition-all duration-150">
          {task.title}
        </p>
      </button>

      {/* Modal overlay - rendered via portal to escape parent stacking context */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal content */}
          <div
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-zinc-800">
              <h2 className="font-mono text-[14px] font-normal tracking-wider uppercase text-white">
                {task.title}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* What */}
              <div className="space-y-2">
                <h3 className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500">
                  what you're doing
                </h3>
                <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
                  {task.guide.what}
                </p>
              </div>

              {/* How */}
              <div className="space-y-3">
                <h3 className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500">
                  how to do it
                </h3>
                <ol className="space-y-3">
                  {task.guide.how.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono text-zinc-400">
                        {i + 1}
                      </span>
                      <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200 pt-0.5">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Why */}
              <div className="space-y-2">
                <h3 className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500">
                  why this works for you
                </h3>
                <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
                  {task.guide.why}
                </p>
              </div>

              {/* Guardrail */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
                  <p className="font-mono text-[12px] font-light tracking-[0.05em] uppercase text-zinc-400">
                    <span className="text-zinc-500">guardrail:</span> {task.guardrail}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded font-mono text-[11px] font-medium tracking-[0.2em] uppercase text-white transition-colors"
              >
                close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}