'use client'

export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button 
        className="btn-ghost text-xs uppercase tracking-[0.15em] font-mono text-zinc-600 mt-2 px-3 py-2 min-h-[44px] rounded"
      >
        Sign Out
      </button>
    </form>
  )
}
