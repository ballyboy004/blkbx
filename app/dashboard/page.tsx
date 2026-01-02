import Link from "next/link";
import type { Profile } from "@/lib/profile/profile";
import { getAuthedUserOrRedirect, requireOnboardingCompleteOrRedirect } from "@/lib/profile/profile";
import { getCompleteDashboardIntelligence } from "@/lib/dashboard/intelligence";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";

export default async function DashboardPage() {
  // Server-side data loading
  const { user } = await getAuthedUserOrRedirect("/");
  if (!user) return null;

  const profile = (await requireOnboardingCompleteOrRedirect(user.id)) as Profile;
  const intelligence = await getCompleteDashboardIntelligence(user.id, profile);

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(30, 40, 60, 0.6) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(40, 30, 50, 0.5) 0%, transparent 50%),
          #0a0a0a
        `
      }}
    >
      {/* 3D Void Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(30,30,30,0.2) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at center, rgba(40,40,40,0.1) 0%, transparent 60%)",
            boxShadow: "inset 0 0 150px 80px rgba(0,0,0,0.5)",
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

            {/* Sign out */}
            <form action="/auth/signout" method="post">
              <button className="text-xs lowercase tracking-tight font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-2">
                sign out
              </button>
            </form>
          </header>

          {/* CURRENT READ - HERO SECTION WITH BREAKDOWN */}
          <div 
            className="p-10 mb-20 space-y-6"
            style={{
              background: 'rgba(26, 26, 26, 0.4)',
              backdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '4px',
              boxShadow: '0 18px 36px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-[12px] font-medium tracking-[0.2em] uppercase text-zinc-500">
                current read
              </h2>
              <button
                className="bg-transparent border px-3 py-1.5 rounded-[2px] font-mono text-[10px] font-medium uppercase transition-all duration-[120ms] hover:bg-white/5"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  letterSpacing: '0.15em'
                }}
              >
                FRESH
              </button>
            </div>
            
            <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
              {intelligence.currentRead}
            </p>

            {/* Focus / Constraint / Priority Breakdown */}
            <div className="grid grid-cols-3 gap-8 pt-4">
              <div>
                <h3 className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 mb-2">
                  focus
                </h3>
                <p className="font-mono text-[14px] font-normal tracking-wider uppercase text-white">
                  {profile.current_focus || "—"}
                </p>
              </div>
              
              <div>
                <h3 className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 mb-2">
                  constraint
                </h3>
                <p className="font-mono text-[14px] font-normal tracking-wider uppercase text-white">
                  {profile.constraints || "—"}
                </p>
              </div>
              
              <div>
                <h3 className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 mb-2">
                  priority
                </h3>
                <p className="font-mono text-[14px] font-normal tracking-wider uppercase text-white">
                  {intelligence.priorityTask?.title || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Grid - REORDERED: YOUR PATTERNS → PROFILE → TODAY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* YOUR PATTERNS CARD - LEFT */}
            <div 
              className="p-8 space-y-4"
              style={{
                background: 'rgba(26, 26, 26, 0.4)',
                backdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '4px',
                boxShadow: '0 9px 24px rgba(0, 0, 0, 0.5)'
              }}
            >
              <h2 className="font-mono text-[12px] font-medium tracking-[0.2em] uppercase text-zinc-500 mb-6">
                your patterns
              </h2>
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 block mb-2">
                    strengths
                  </span>
                  <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
                    {profile.strengths || "—"}
                  </p>
                </div>
                
                <div>
                  <span className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 block mb-2">
                    growth areas
                  </span>
                  <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
                    {profile.weaknesses || "—"}
                  </p>
                </div>
                
                <div>
                  <span className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 block mb-2">
                    constraints
                  </span>
                  <p className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
                    {profile.constraints || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* PROFILE CARD - MIDDLE */}
            <div 
              className="p-8 space-y-4"
              style={{
                background: 'rgba(26, 26, 26, 0.4)',
                backdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '4px',
                boxShadow: '0 9px 24px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-mono text-[12px] font-medium tracking-[0.2em] uppercase text-zinc-500">
                  profile
                </h2>
                <button
                  className="bg-transparent border px-3 py-1.5 rounded-[2px] font-mono text-[10px] font-medium uppercase transition-all duration-[120ms] hover:bg-white/5 hover:translate-y-[-1px]"
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    letterSpacing: '0.15em'
                  }}
                >
                  EDIT
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 block mb-2">
                    primary goal
                  </span>
                  <p className="font-mono text-[14px] font-normal tracking-wider uppercase text-white">
                    {profile.primary_goal || "—"}
                  </p>
                </div>
                
                <div>
                  <span className="font-mono text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500 block mb-2">
                    career stage
                  </span>
                  <p className="font-mono text-[14px] font-normal tracking-wider uppercase text-white">
                    {profile.career_stage || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* TODAY CARD - RIGHT (EMPTY STATE) */}
            <div 
              className="p-8 space-y-4"
              style={{
                background: 'rgba(26, 26, 26, 0.4)',
                backdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '4px',
                boxShadow: '0 9px 24px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-mono text-[12px] font-medium tracking-[0.2em] uppercase text-zinc-500">
                  today
                </h2>
                <div className="flex gap-2">
                  <button
                    className="bg-transparent border px-2 py-1 rounded-[2px] font-mono text-[9px] font-medium uppercase"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      letterSpacing: '0.15em',
                      color: 'rgba(255, 255, 255, 0.4)'
                    }}
                  >
                    SKIP
                  </button>
                  <button
                    className="bg-transparent border px-2 py-1 rounded-[2px] font-mono text-[9px] font-medium uppercase"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      letterSpacing: '0.15em',
                      color: 'rgba(255, 255, 255, 0.4)'
                    }}
                  >
                    WITH TASK
                  </button>
                </div>
              </div>

              {/* Empty State */}
              <div className="space-y-4 py-8">
                <p className="font-mono text-[12px] font-light tracking-[0.05em] uppercase text-zinc-500 italic text-center">
                  no tasks yet
                </p>
                
                <p className="font-mono text-[11px] font-light tracking-[0.05em] uppercase leading-[1.6] text-zinc-400 text-center">
                  tasks appear here when blackbox identifies strategic actions based on your patterns.
                </p>
                
                <p className="font-mono text-[10px] font-light tracking-[0.05em] uppercase text-zinc-600 text-center">
                  → edit your profile to unlock tasks
                </p>
                
                <button
                  className="w-full mt-6 py-3 bg-transparent border font-mono text-[11px] font-medium uppercase transition-all duration-[120ms] hover:bg-white/5"
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    letterSpacing: '0.15em'
                  }}
                >
                  + add first task
                </button>
              </div>
            </div>

            {/* CONTEXT NOTES - COLLAPSIBLE (SPANS 2 COLS) */}
            <div className="md:col-span-2">
              <CollapsibleSection title="context notes">
                {intelligence.strategicContext?.length ? (
                  <ul className="space-y-3">
                    {intelligence.strategicContext.map((b: string, i: number) => (
                      <li key={i} className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
                        • {b}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-[12px] font-light tracking-[0.05em] uppercase text-zinc-400 italic">
                    —
                  </p>
                )}
              </CollapsibleSection>
            </div>

            {/* NEXT ACTIONS - COLLAPSIBLE */}
            <CollapsibleSection title="next actions">
              {intelligence.nextActions?.length ? (
                <div className="space-y-3">
                  {intelligence.nextActions.map((action: string, i: number) => (
                    <p key={i} className="font-mono text-[14px] font-light tracking-[0.05em] uppercase leading-[1.7] text-zinc-200">
                      • {action}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-[12px] font-light tracking-[0.05em] uppercase text-zinc-400 italic">
                  no actions scheduled
                  <br /><br />
                  actions appear as you complete tasks and build momentum. focus on today's priority first.
                </p>
              )}
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}