'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buttonClass } from '@/lib/design-system'

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
      className={buttonClass.ghost}
    >
      {isRefreshing ? '...' : 'Refresh'}
    </button>
  )
}
