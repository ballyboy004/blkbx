'use client'

import { useState } from 'react'

export type NodeVariant = 'center' | 'orbit'
export type NodeState = 'dormant' | 'forming' | 'structured' | 'active' | 'resolved'

type NodeProps = {
  label: string
  sublabel?: string
  nextAction?: string
  variant: NodeVariant
  isActive?: boolean
  isEmpty?: boolean
  isBackgrounded?: boolean
  nodeState?: NodeState
  onClick?: () => void
}

export function Node({ label, sublabel, nextAction, variant, isActive, isEmpty, isBackgrounded, onClick }: NodeProps) {
  const [hovered, setHovered] = useState(false)

  if (variant === 'center') {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex flex-col items-center justify-center rounded-full cursor-pointer select-none"
        style={{
          width: 148,
          height: 148,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          backdropFilter: 'none',
          transition: 'none',
          animation: 'nodePulse 6s ease-in-out infinite',
        }}
        aria-label={label}
      >
        {/* Layer 1 — bright core center */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.01) 55%, transparent 72%)',
            animation: 'haloBreath 6s ease-in-out infinite',
          }}
        />

        {/* Layer 2 — mid diffusion */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -28,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, transparent 68%)',
            animation: 'haloBreath 6s ease-in-out infinite 0.5s',
          }}
        />

        {/* Layer 3 — outer atmospheric haze */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -60,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.008) 45%, transparent 70%)',
            animation: 'haloBreath 6s ease-in-out infinite 1s',
          }}
        />

        {/* Layer 4 — far ambient field */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -100,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 60%)',
            animation: 'haloBreath 7s ease-in-out infinite 1.5s',
          }}
        />

        {/* Label */}
        <span
          className="font-mono text-[13px] font-semibold text-white text-center px-4 leading-snug z-10"
          style={{
            maxWidth: 124,
            letterSpacing: '0.02em',
            textShadow: '0 0 24px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.15)',
          }}
        >
          {label}
        </span>

        {/* Sublabel */}
        {sublabel && (
          <span
            className="font-mono text-[10px] text-center mt-1.5 px-4 leading-snug z-10"
            style={{
              maxWidth: 124,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.08em',
              textShadow: '0 0 16px rgba(255,255,255,0.2)',
            }}
          >
            {sublabel}
          </span>
        )}

        {/* Next action */}
        {nextAction && (
          <span
            className="font-mono text-[9px] text-center mt-2 px-4 z-10"
            style={{
              maxWidth: 132,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.05em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              textShadow: '0 0 12px rgba(255,255,255,0.15)',
            }}
          >
            ↳ {nextAction}
          </span>
        )}
      </button>
    )
  }

  // Orbit node — minimal signal marker (dot + label)
  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: 44, height: 66 }}
    >
      {/* Touch target button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          pointerEvents: isBackgrounded ? 'none' : 'auto',
        }}
        aria-label={label}
      >
        {/* Halo ring — faint expanding circle */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 28,
            height: 28,
            border: isActive
              ? '1px solid rgba(255,255,255,0.18)'
              : hovered
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(255,255,255,0.05)',
            borderRadius: '50%',
            transition: 'border-color 300ms ease-out, opacity 300ms ease-out',
            opacity: isBackgrounded ? 0.04 : 1,
            animation: isActive ? 'markerHalo 3s ease-in-out infinite' : 'none',
          }}
        />

        {/* Core dot */}
        <div
          style={{
            width: isActive ? 7 : hovered ? 6 : 5,
            height: isActive ? 7 : hovered ? 6 : 5,
            borderRadius: '50%',
            background: isActive
              ? 'rgba(255,255,255,0.85)'
              : hovered
              ? 'rgba(255,255,255,0.5)'
              : isEmpty
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(255,255,255,0.28)',
            boxShadow: isActive
              ? '0 0 8px rgba(255,255,255,0.4)'
              : 'none',
            transition: 'all 300ms ease-out',
            opacity: isBackgrounded ? 0.05 : 1,
          }}
        />
      </button>

      {/* Label — floats below the dot */}
      <span
        className="font-mono text-center leading-none pointer-events-none select-none"
        style={{
          fontSize: '8px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: isBackgrounded
            ? 'rgba(255,255,255,0.03)'
            : isActive
            ? 'rgba(255,255,255,0.7)'
            : hovered
            ? 'rgba(255,255,255,0.45)'
            : 'rgba(255,255,255,0.2)',
          transition: 'color 300ms ease-out',
          marginTop: 2,
        }}
      >
        {label}
      </span>
    </div>
  )
}
