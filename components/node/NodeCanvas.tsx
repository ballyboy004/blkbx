'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Node } from './Node'
import { NodePanel } from './NodePanel'

export type OrbitNodeConfig = {
  id: string
  label: string
  isEmpty?: boolean
  panelTitle: string
  content: React.ReactNode
}

type NodeCanvasProps = {
  centerLabel: string
  centerSublabel?: string
  nextAction?: string
  orbitNodes: [OrbitNodeConfig, OrbitNodeConfig]
  headerSlot?: React.ReactNode
}

// Orbit positions — 2 markers: top-left, top-right
const ORBIT_POSITIONS = [
  { top: -160, left: -130 },  // top-left
  { top: -140, left:  100 },  // top-right
]

// Parallax multipliers per layer — different rates create depth
const CENTER_PARALLAX = 0.004   // center moves least — feels anchored
const ORBIT_PARALLAX  = [0.011, 0.009]

// Focus offset when an orbit node is active — canvas shifts toward that node
const FOCUS_OFFSETS = [
  { x: -16, y: -12 },
  { x:  16, y: -12 },
]
const FOCUS_SCALE_ACTIVE = 1.035
const FOCUS_SCALE_DEFAULT = 1

export function NodeCanvas({ centerLabel, centerSublabel, nextAction, orbitNodes, headerSlot }: NodeCanvasProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const rawMouse = useRef({ x: 0, y: 0 })

  // Smooth mouse tracking via RAF — slower lerp for more ambient feel
  const tick = useCallback(() => {
    setMouse(prev => ({
      x: prev.x + (rawMouse.current.x - prev.x) * 0.04,
      y: prev.y + (rawMouse.current.y - prev.y) * 0.04,
    }))
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      rawMouse.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      }
    }
    el.addEventListener('mousemove', handleMove)
    return () => el.removeEventListener('mousemove', handleMove)
  }, [])

  function handleOrbitClick(id: string) {
    setActiveNodeId(prev => prev === id ? null : id)
  }

  const activeNode = orbitNodes.find(n => n.id === activeNodeId) ?? null

  // Center parallax
  const cx = mouse.x * CENTER_PARALLAX
  const cy = mouse.y * CENTER_PARALLAX

  // Focus offset and scale when an orbit node is active
  const activeIndex = activeNodeId
    ? orbitNodes.findIndex(n => n.id === activeNodeId)
    : -1
  const focusOffset = activeIndex >= 0 ? FOCUS_OFFSETS[activeIndex] : { x: 0, y: 0 }
  const focusScale = activeIndex >= 0 ? FOCUS_SCALE_ACTIVE : FOCUS_SCALE_DEFAULT

  const particles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      top: `${5 + Math.random() * 90}%`,
      size: 1 + Math.random() * 1.5,
      opacity: 0.04 + Math.random() * 0.1,
      duration: `${28 + Math.random() * 30}s`,
      delay: `-${Math.random() * 22}s`,
      drift: Math.random() > 0.5 ? 1 : -1,
    }))
  }, [])

  return (
    <div
      ref={canvasRef}
      className="relative w-full min-h-screen overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* ── Grain overlay ── */}
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          opacity: 0.038,
          mixBlendMode: 'overlay',
          animation: 'grainShift 0.5s steps(1) infinite',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          <filter id="grain-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-filter)" />
        </svg>
      </div>

      {/* ── Particle drift layer ── */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 1 }}
      >
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: 'rgba(255,255,255,1)',
              opacity: p.opacity,
              '--p-opacity': p.opacity,
              '--p-drift': p.drift,
              animation: `particleFloat ${p.duration} ease-in-out ${p.delay} infinite`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes haloBreath {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.9; }
        }
        @keyframes nodePulse {
          0%, 100% {
            filter: drop-shadow(0 0 18px rgba(255,255,255,0.06)) drop-shadow(0 0 60px rgba(255,255,255,0.02));
          }
          50% {
            filter: drop-shadow(0 0 28px rgba(255,255,255,0.1)) drop-shadow(0 0 90px rgba(255,255,255,0.04));
          }
        }
        @keyframes markerHalo {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 0.3; }
        }
        @keyframes orbitDrift0 {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(-1.5px, 2px); }
        }
        @keyframes orbitDrift1 {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(2px, -1.5px); }
        }
        @keyframes particleFloat {
          0% { transform: translateY(0px) translateX(0px); opacity: var(--p-opacity); }
          25% { transform: translateY(-18px) translateX(calc(var(--p-drift) * 6px)); }
          50% { transform: translateY(-32px) translateX(calc(var(--p-drift) * 2px)); opacity: calc(var(--p-opacity) * 0.4); }
          75% { transform: translateY(-20px) translateX(calc(var(--p-drift) * -4px)); }
          100% { transform: translateY(0px) translateX(0px); opacity: var(--p-opacity); }
        }
        @keyframes grainShift {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(1px, -1px); }
          60% { transform: translate(-1px, 0px); }
          80% { transform: translate(1px, 1px); }
        }
      `}</style>

      {/* Header overlay */}
      {headerSlot && (
        <div className="absolute top-0 left-0 z-20 px-6 sm:px-10 py-8">
          {headerSlot}
        </div>
      )}

      {/* Dark scrim when a node is focused */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.18)',
          opacity: activeNodeId !== null ? 1 : 0,
          transition: 'opacity 400ms ease-out',
        }}
      />

      {/* Canvas center anchor — parallax + focus offset/scale */}
      <div
        className="absolute z-20"
        style={{
          left: '50%',
          top: '48%',
          transform: `translate(calc(-50% + ${cx + focusOffset.x}px), calc(-50% + ${cy + focusOffset.y}px)) scale(${focusScale})`,
          transition: 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Ambient radial glow behind center node */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 420,
            height: 420,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 30%, transparent 65%)',
            borderRadius: '50%',
            animation: 'haloBreath 6s ease-in-out infinite, nodePulse 6s ease-in-out infinite',
            zIndex: -1,
          }}
        />
        {/* Center node */}
        <Node
          variant="center"
          label={centerLabel}
          sublabel={centerSublabel}
          nextAction={nextAction}
          onClick={() => setActiveNodeId(null)}
        />

        {/* Orbit nodes — position + parallax, inner drift animation */}
        {orbitNodes.map((node, i) => (
          <div
            key={node.id}
            className="absolute"
            style={{
              top: ORBIT_POSITIONS[i].top + mouse.y * ORBIT_PARALLAX[i],
              left: ORBIT_POSITIONS[i].left + mouse.x * ORBIT_PARALLAX[i],
              zIndex: activeNodeId === node.id ? 30 : 20,
            }}
          >
            <div
              style={{
                animation: `orbitDrift${i} ${[7, 8.4][i]}s ease-in-out infinite`,
              }}
            >
              <Node
                variant="orbit"
                label={node.label}
                isActive={activeNodeId === node.id}
                isEmpty={node.isEmpty}
                isBackgrounded={activeNodeId !== null && activeNodeId !== node.id}
                onClick={() => handleOrbitClick(node.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <NodePanel
        title={activeNode?.panelTitle ?? ''}
        isOpen={activeNodeId !== null}
        onClose={() => setActiveNodeId(null)}
      >
        {activeNode?.content ?? null}
      </NodePanel>
    </div>
  )
}
