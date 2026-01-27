import Link from "next/link";
import type { Profile } from "@/lib/profile/profile";
import { getAuthedUserOrRedirect, requireOnboardingCompleteOrRedirect } from "@/lib/profile/profile";
import { getCompleteDashboardIntelligence } from "@/lib/dashboard/intelligence";
import { getBehavioralHistory } from "@/lib/intelligence/history";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import TodayCard from "@/components/dashboard/TodayCard";
import FreshButton from "@/components/dashboard/FreshButton";
import EditProfileModal from "@/components/dashboard/EditProfileModal";

// Typography constants
const bodyText = "font-mono text-[13px] font-normal tracking-normal leading-[1.7] text-zinc-300"
const labelStyle = "font-mono text-[12px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-2"
const headerStyle = "font-mono text-[13px] font-semibold tracking-[0.2em] uppercase text-zinc-500"

// Card styles with 3D depth
const cardStyleBase = {
  background: 'rgba(26, 26, 26, 0.4)',
  backdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)'
}

const cardStyleMedium = {
  background: 'rgba(26, 26, 26, 0.4)',
  backdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderTop: '1px solid rgba(255, 255, 255, 0.07)',
  borderRadius: '4px',
  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.35), 0 12px 24px rgba(0, 0, 0, 0.25)'
}

export default async function DashboardPage() {
  const { user } = await getAuthedUserOrRedirect("/");
  if (!user) return null;

  const profile = (await requireOnboardingCompleteOrRedirect(user.id)) as Profile;
  const intelligence = await getCompleteDashboardIntelligence(user.id, profile);
  
  // Fetch recent tasks for the TodayCard
  const history = await getBehavioralHistory(user.id, { limit: 10 });
  const recentTasks = history.recentTasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    created_at: t.completed_at,
    reflection: t.reflection,
    reasoning: t.reasoning,
    guardrail: t.guardrail
  }));

  const hasTask = intelligence.priorityTask?.title && intelligence.priorityTask.title !== "—";

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
      <div className="relative z-10 min-h-screen px-4 sm:px-6 md:px-10 py-8 sm:py-12">
        <div className="max-w-[1100px] mx-auto space-y-6 sm:space-y-8">
          
          {/* Header */}
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Link href="/">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-inter font-black tracking-[-0.08em] text-white lowercase hover:text-zinc-200 transition-colors cursor-pointer">
                  blackbox<span className="text-2xl sm:text-3xl">.</span>
                </h1>
              </Link>
              <p className="text-xs uppercase tracking-[0.2em] font-mono text-zinc-500">Dashboard</p>
            </div>

            <form action="/auth/signout" method="post">
              <button className="text-xs uppercase tracking-[0.15em] font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-2 px-3 py-2 min-h-[44px]">
                Sign Out
              </button>
            </form>
          </header>

          {/* TODAY - HERO POSITION */}
          {hasTask ? (
            <div className="relative">
              {/* Background glow behind TODAY card */}
              <div 
                className="absolute inset-0 -z-10 rounded-[4px] opacity-30"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(40, 40, 50, 0.15) 0%, transparent 70%)',
                  transform: 'translateY(8px) scale(1.02)'
                }}
              />
              <TodayCard task={intelligence.priorityTask} recentTasks={recentTasks} />
            </div>
          ) : (
            <div className="relative">
              <div 
                className="absolute inset-0 -z-10 rounded-[4px] opacity-30"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(40, 40, 50, 0.15) 0%, transparent 70%)',
                  transform: 'translateY(8px) scale(1.02)'
                }}
              />
              <div className="p-6 sm:p-8 md:p-10" style={cardStyleMedium}>
                <h2 className={`${headerStyle} mb-6`}>Today</h2>
                <div className="space-y-4 py-8">
                  <p className="font-mono text-[13px] text-zinc-500 italic text-center">
                    No tasks yet
                  </p>
                  <p className={`${bodyText} text-center text-zinc-400`}>
                    Tasks appear when Blackbox identifies actions based on your situation.
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-600 text-center">
                    → Edit profile to unlock tasks
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CURRENT READ */}
          <div className="p-6 sm:p-8 md:p-10" style={cardStyleBase}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={headerStyle}>Current Read</h2>
              <FreshButton />
            </div>
            <p className={bodyText}>{intelligence.currentRead}</p>
          </div>

          {/* PROFILE + PATTERNS - 2-COLUMN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
            {/* PROFILE CARD */}
            <div className="p-6 sm:p-8 space-y-4" style={cardStyleMedium}>
              <div className="flex justify-between items-start mb-6">
                <h2 className={headerStyle}>Profile</h2>
                <EditProfileModal profile={profile} />
              </div>
              <div className="space-y-5">
                <div>
                  <span className={labelStyle}>Goal</span>
                  <p className={bodyText}>{profile.primary_goal || "—"}</p>
                </div>
                <div>
                  <span className={labelStyle}>Focus</span>
                  <p className={bodyText}>{profile.current_focus || "—"}</p>
                </div>
                <div>
                  <span className={labelStyle}>Constraints</span>
                  <p className={bodyText}>{profile.constraints || "—"}</p>
                </div>
                <div>
                  <span className={labelStyle}>Stage</span>
                  <p className={`${bodyText} capitalize`}>{profile.career_stage || "—"}</p>
                </div>
              </div>
            </div>

            {/* PATTERNS CARD */}
            <div className="p-6 sm:p-8 space-y-4" style={cardStyleMedium}>
              <h2 className={`${headerStyle} mb-6`}>Patterns</h2>
              <div className="space-y-5">
                <div>
                  <span className={labelStyle}>Edge</span>
                  <p className={bodyText}>{intelligence.edge || "—"}</p>
                </div>
                <div>
                  <span className={labelStyle}>Friction</span>
                  <p className={bodyText}>{intelligence.friction || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE SECTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CollapsibleSection title="Context Notes">
              {intelligence.strategicContext?.length ? (
                <ul className="space-y-3">
                  {intelligence.strategicContext.map((b: string, i: number) => (
                    <li key={i} className={bodyText}>• {b}</li>
                  ))}
                </ul>
              ) : (
                <p className="font-mono text-[13px] text-zinc-400 italic">—</p>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Next Actions">
              {intelligence.nextActions?.length ? (
                <div className="space-y-3">
                  {intelligence.nextActions.map((action: string, i: number) => (
                    <p key={i} className={bodyText}>• {action}</p>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-[13px] text-zinc-400 italic">
                  Complete today's task to see what's next.
                </p>
              )}
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}
