export default function CampaignLoading() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ background: '#0c0c0e' }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
        BLACKBOX
      </p>
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-2 w-48 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full animate-pulse"
            style={{
              width: '40%',
              background: 'rgba(255,255,255,0.35)',
            }}
          />
        </div>
        <p className="font-mono text-[11px] text-zinc-500">Loading campaign…</p>
      </div>
    </div>
  )
}
