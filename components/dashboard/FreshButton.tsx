'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  async function handleRefresh() {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    
    try {
      // Call the fast Current Read endpoint (2-3 seconds)
      const response = await fetch('/api/intelligence/current-read', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh the page to show updated Current Read
        router.refresh()
      } else {
        console.error('[FRESH] Failed:', data.error)
      }
    } catch (error) {
      console.error('[FRESH] Error:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="bg-transparent border border-white/30 rounded-sm font-mono font-medium uppercase transition-all duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[9px] px-3 py-2 tracking-[0.12em] min-h-[44px]"
      style={{
        boxShadow: isRefreshing ? 'none' : 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={(e) => {
        if (!isRefreshing) {
          e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
          e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.2)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isRefreshing) {
          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
        }
      }}
    >
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  )
}
