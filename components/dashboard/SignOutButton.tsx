'use client'

export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button 
        className="text-xs uppercase tracking-[0.15em] font-mono text-zinc-600 hover:text-zinc-400 transition-all mt-2 px-3 py-2 min-h-[44px] rounded"
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
        Sign Out
      </button>
    </form>
  )
}
