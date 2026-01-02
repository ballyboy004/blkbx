'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}

export default function CollapsibleSection({ title, children, defaultExpanded = false }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <div 
      className="p-8"
      style={{
        background: 'rgba(26, 26, 26, 0.4)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '4px',
        boxShadow: '0 9px 24px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center transition-all duration-200 hover:bg-white/[0.02] rounded-[2px] p-2 -m-2 cursor-pointer mb-2"
      >
        <h2 className="font-mono text-[12px] font-medium tracking-[0.2em] uppercase text-zinc-500">
          {title}
        </h2>
        <span 
          className="font-mono text-[12px] text-zinc-500 transition-transform duration-250"
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          ▼
        </span>
      </button>
      
      {/* Collapsible content */}
      <div 
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isExpanded ? '1000px' : '0',
          opacity: isExpanded ? 1 : 0,
          marginTop: isExpanded ? '16px' : '0'
        }}
      >
        {children}
      </div>
    </div>
  )
}
