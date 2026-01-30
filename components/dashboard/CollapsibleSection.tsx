'use client'

import { useState } from 'react'
import { typography } from '@/lib/typography'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}

export default function CollapsibleSection({ title, children, defaultExpanded = false }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  const cardStyle = {
    background: 'rgba(26, 26, 26, 0.4)',
    backdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)'
  }
  
  return (
    <div className="p-6 sm:p-8" style={cardStyle}>
      {/* Clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center min-h-[44px] rounded px-1 -mx-1 transition-all"
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
        <h2 className={typography.cardHeader}>
          {title}
        </h2>
        <span 
          className="font-mono text-[12px] text-zinc-500 transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
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
        {children || <p className="font-mono text-[12px] text-zinc-500 italic">Nothing here yet</p>}
      </div>
    </div>
  )
}
