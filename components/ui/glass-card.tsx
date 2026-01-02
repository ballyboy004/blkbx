"use client"

import React from 'react'

type GlassCardProps = {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ 
  children, 
  className = ""
}: GlassCardProps) {
  return (
    <div 
      className={`
        relative
        rounded-[4px]
        p-8
        border
        ${className}
      `}
      style={{
        background: 'rgba(26, 26, 26, 0.4)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        boxShadow: `
          0 9px 24px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.03)
        `
      }}
    >
      {children}
    </div>
  )
}
