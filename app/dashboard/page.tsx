import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* 3D Void Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(30,30,30,0.4) 0%, rgba(0,0,0,0.8) 50%, #000 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at center, rgba(40,40,40,0.2) 0%, transparent 60%)",
            boxShadow: "inset 0 0 200px 100px rgba(0,0,0,0.9)",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen px-4 py-12">
        <div className="max-w-[900px] mx-auto space-y-12">
          {/* Header */}
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Link href="/">
                <h1 className="text-5xl font-inter font-black tracking-[-0.08em] text-white lowercase hover:text-zinc-200 transition-colors cursor-pointer">
                  blackbox<span className="text-3xl">.</span>
                </h1>
              </Link>
              <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">dashboard</p>
            </div>
            <button className="text-xs lowercase tracking-tight font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-2">
              sign out
            </button>
          </header>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Snapshot Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-inter font-black tracking-tight text-white lowercase">profile snapshot</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">primary goal</p>
                  <p className="text-sm font-mono tracking-tight text-zinc-300 lowercase">
                    build sustainable creative practice
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">career stage</p>
                  <p className="text-sm font-mono tracking-tight text-zinc-300 lowercase">emerging artist</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">current focus</p>
                  <p className="text-sm font-mono tracking-tight text-zinc-300 lowercase">
                    developing portfolio & exhibition strategy
                  </p>
                </div>
              </div>
            </div>

            {/* Your Patterns Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-inter font-black tracking-tight text-white lowercase">your patterns</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">strengths</p>
                  <p className="text-sm font-mono tracking-tight text-zinc-300 lowercase">
                    conceptual depth, technical execution
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">weaknesses</p>
                  <p className="text-sm font-mono tracking-tight text-zinc-300 lowercase">networking, self-promotion</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">constraints</p>
                  <p className="text-sm font-mono tracking-tight text-zinc-300 lowercase">limited time, budget</p>
                </div>
              </div>
            </div>

            {/* Today Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-inter font-black tracking-tight text-white lowercase">today</h2>
              <div className="flex items-center justify-center min-h-[120px]">
                <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase italic">no items yet</p>
              </div>
            </div>

            {/* Context Card - Spans 2 columns */}
            <div className="md:col-span-2 bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-inter font-black tracking-tight text-white lowercase">context</h2>
              <div className="flex items-center justify-center min-h-[120px]">
                <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase italic">no context added</p>
              </div>
            </div>

            {/* Next Actions Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-inter font-black tracking-tight text-white lowercase">next actions</h2>
              <div className="flex items-center justify-center min-h-[120px]">
                <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase italic">no actions yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
