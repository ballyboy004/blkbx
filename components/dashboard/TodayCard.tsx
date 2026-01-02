'use client'

import { TaskGuideModal } from "@/components/dashboard/TaskGuideModal";
import type { PriorityTask } from '@/lib/intelligence/interpret'

interface TodayCardProps {
  task: PriorityTask
}

export default function TodayCard({ task }: TodayCardProps) {
  return (
    <div 
      className="p-8 space-y-4 transition-all duration-200 group"
      style={{
        background: 'rgba(26, 26, 26, 0.4)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '4px',
        boxShadow: '0 9px 24px rgba(0, 0, 0, 0.5)'
      }}
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
      <h2 className="font-mono text-[12px] font-medium tracking-[0.2em] uppercase text-zinc-500 mb-6">
        today
      </h2>
      <div className="space-y-6">
        <div>
          <span className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 block mb-2">
            focus
          </span>
          <TaskGuideModal task={task} />
          <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200 mt-3">
            {task.reasoning}
          </p>
        </div>

        <div>
          <span className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 block mb-2">
            guardrail
          </span>
          <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
            {task.guardrail}
          </p>
        </div>
      </div>
    </div>
  )
}