// components/Logo.tsx
// BLACKBOX logo with square period

type LogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: { text: 'text-3xl', period: 'w-2 h-2', gap: 'ml-0.5', periodOffset: '-translate-y-0.5' },
  md: { text: 'text-5xl', period: 'w-3 h-3', gap: 'ml-1', periodOffset: '-translate-y-1' },
  lg: { text: 'text-6xl', period: 'w-3.5 h-3.5', gap: 'ml-1', periodOffset: '-translate-y-1' },
  xl: { text: 'text-7xl', period: 'w-4 h-4', gap: 'ml-1.5', periodOffset: '-translate-y-1.5' },
}

export default function Logo({ size = 'lg', className = '' }: LogoProps) {
  const s = sizes[size]
  
  return (
    <div className={`flex items-end ${className}`}>
      <span className={`${s.text} font-inter font-black tracking-[-0.08em] text-white lowercase`}>
        blackbox
      </span>
      <div className={`${s.period} ${s.gap} ${s.periodOffset} bg-white mb-2`} />
    </div>
  )
}
