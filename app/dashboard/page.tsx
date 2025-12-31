
import Link from "next/link";
import type { Profile } from "@/lib/profile/profile";
import { getAuthedUserOrRedirect, requireOnboardingCompleteOrRedirect } from "@/lib/profile/profile";

export default async function DashboardPage() {
  // 1) must be logged in
  const { user } = await getAuthedUserOrRedirect("/");

// ✅ TS guard (helper redirects, but TS doesn't know that)
if (!user) return null;

const profile = (await requireOnboardingCompleteOrRedirect(user.id)) as Profile;

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* 3D Void Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(30,30,30,0.4) 0%, rgba(0,0,0,0.8) 50%, #000 100%)",
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

            {/* REAL sign out */}
            <form action="/auth/signout" method="post">
              <button className="text-xs lowercase tracking-tight font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-2">
                sign out
              </button>
            </form>
          </header>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Snapshot Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-inter font-black tracking-tight text-white lowercase">profile snapshot</h2>
              <div className="space-y-3">
                <Field label="primary goal" value={profile.primary_goal} />
                <Field label="career stage" value={profile.career_stage} />
                <Field label="current focus" value={profile.current_focus} />
              </div>
            </div>

            {/* Your Patterns Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-inter font-black tracking-tight text-white lowercase">your patterns</h2>
              <div className="space-y-3">
                <Field label="strengths" value={profile.strengths} />
                <Field label="weaknesses" value={profile.weaknesses} />
                <Field label="constraints" value={profile.constraints} />
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
              <div className="min-h-[120px]">
                {profile.context ? (
                  <p className="text-sm font-mono tracking-tight text-zinc-300 lowercase leading-relaxed whitespace-pre-wrap">
                    {profile.context}
                  </p>
                ) : (
                  <div className="flex items-center justify-center min-h-[120px]">
                    <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase italic">no context added</p>
                  </div>
                )}
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
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">{label}</p>
      <p className="text-sm font-mono tracking-tight text-zinc-300 lowercase">{value || "—"}</p>
    </div>
  );
}