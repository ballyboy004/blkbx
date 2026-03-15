'use client'

type NodePanelProps = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function NodePanel({ title, isOpen, onClose, children }: NodePanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '58%',
        transform: isOpen
          ? 'translate(-50%, -50%) scale(1)'
          : 'translate(-50%, -50%) scale(0.96)',
        zIndex: 40,
        width: 'min(400px, 40vw)',
        maxHeight: '70vh',
        overflowY: 'auto',
        background: 'rgba(10, 10, 14, 0.97)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '6px',
        backdropFilter: 'blur(48px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 250ms ease-out, transform 250ms ease-out',
        pointerEvents: isOpen ? 'auto' : 'none',
        padding: '36px 32px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
          {title}
        </span>
        <button
          onClick={onClose}
          className="font-mono text-[18px] text-zinc-600 hover:text-zinc-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
