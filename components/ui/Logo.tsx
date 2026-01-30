'use client'

import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

export function Logo({ size = 'md', href = '/' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-2xl sm:text-3xl',
    md: 'text-3xl sm:text-4xl md:text-5xl',
    lg: 'text-5xl sm:text-6xl'
  }

  const dotSizeClasses = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl'
  }

  const content = (
    <h1 className={`${sizeClasses[size]} font-inter font-black tracking-[-0.08em] text-white lowercase hover:text-zinc-200 transition-colors cursor-pointer`}>
      blackbox<span className={dotSizeClasses[size]}>.</span>
    </h1>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
