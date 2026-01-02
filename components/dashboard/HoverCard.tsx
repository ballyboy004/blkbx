'use client'

interface HoverCardProps {
  children: React.ReactNode
}

export default function HoverCard({ children }: HoverCardProps) {
  return (
    <div 
      className="p-8 space-y-4 transition-all duration-200"
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
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.8)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(26, 26, 26, 0.4)'
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 9px 24px rgba(0, 0, 0, 0.5)'
      }}
    >
      {children}
    </div>
  )
}