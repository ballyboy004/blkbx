"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type CareerStage = "early" | "building" | "momentum" | "breakout" | "pro";

type InitialProfile = {
  context: string;
  primary_goal: string;
  genre_sound: string;
  career_stage: CareerStage;
  strengths: string;
  weaknesses: string;
  constraints: string;
  current_focus: string;
};

export default function OnboardingClient({
  userId,
  userEmail,
  initialProfile,
}: {
  userId: string;
  userEmail: string;
  initialProfile: InitialProfile;
}) {
  const supabase = createClient();
  const SLIDE_MS = 7500; // slower, luxury feel

  // Steps: 1 = context, 2 = direction, 3 = patterns
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSliding, setIsSliding] = useState(false);

  // Step 1
  const [context, setContext] = useState(initialProfile.context ?? "");

  // Step 2
  const [primaryGoal, setPrimaryGoal] = useState(initialProfile.primary_goal ?? "");
  const [genreSound, setGenreSound] = useState(initialProfile.genre_sound ?? "");
  const [careerStage, setCareerStage] = useState<CareerStage>(initialProfile.career_stage ?? "building");

  // Step 3
  const [strengths, setStrengths] = useState(initialProfile.strengths ?? "");
  const [weaknesses, setWeaknesses] = useState(initialProfile.weaknesses ?? "");
  const [constraints, setConstraints] = useState(initialProfile.constraints ?? "");
  const [currentFocus, setCurrentFocus] = useState(initialProfile.current_focus ?? "");

  const stepMeta = useMemo(() => {
    if (step === 1) return { subtitle: "setup / context", title: "tell us about yourself" };
    if (step === 2) return { subtitle: "setup / direction", title: "direction & intent" };
    return { subtitle: "setup / patterns", title: "how you move" };
  }, [step]);

  // Slider transform: pixel-based to avoid subpixel % rounding (prevents edge "remnants")
  const stepIndex = step - 1; // 0, 1, 2
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportW, setViewportW] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => setViewportW(el.getBoundingClientRect().width);
    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const trackTransform = `translate3d(-${stepIndex * viewportW}px, 0, 0)`;

  async function upsertProfile(payload: Record<string, any>) {
    if (!userId) return { ok: false, message: "No user session found." };
    if (!userEmail) return { ok: false, message: "No email found for this user session." };

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: userEmail,
          ...payload,
        },
        { onConflict: "id" }
      );

    if (error) return { ok: false, message: error.message };
    return { ok: true as const, message: "" };
  }

  async function handleContinue() {
    if (step === 1) {
      const res = await upsertProfile({ context });
      if (!res.ok) return alert(res.message);
      setIsSliding(true);
      setStep(2);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
      return;
    }

    if (step === 2) {
      const res = await upsertProfile({
        primary_goal: primaryGoal,
        genre_sound: genreSound,
        career_stage: careerStage,
      });
      if (!res.ok) return alert(res.message);
      setIsSliding(true);
      setStep(3);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
      return;
    }

    // step === 3
    const res = await upsertProfile({
      strengths,
      weaknesses,
      constraints,
      current_focus: currentFocus,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
    if (!res.ok) return alert(res.message);

    // hard nav so middleware/SSR sees the latest
    window.location.assign("/dashboard");
  }

  function handleBack() {
    if (step === 1) return;
    setIsSliding(true);
    setStep((s) => (s === 2 ? 1 : 2));
    setTimeout(() => setIsSliding(false), SLIDE_MS);
  }

  function handleSkip() {
    if (step === 1) {
      setIsSliding(true);
      setStep(2);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
    } else if (step === 2) {
      setIsSliding(true);
      setStep(3);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
    } else {
      window.location.assign("/dashboard");
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* 3D Void Vignette */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(30,30,30,0.4) 0%, rgba(0,0,0,0.85) 55%, #000 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at center, rgba(40,40,40,0.18) 0%, transparent 60%)",
            boxShadow: "inset 0 0 220px 110px rgba(0,0,0,0.95)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-[600px] space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <Link href="/">
              <h1 className="text-6xl font-inter font-black tracking-[-0.08em] text-white lowercase cursor-pointer hover:text-zinc-200 transition-colors">
                blackbox<span className="text-4xl">.</span>
              </h1>
            </Link>
            <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">{stepMeta.subtitle}</p>
          </div>

          {/* Slider */}
          <div ref={viewportRef} className="relative overflow-hidden px-[1px]">
            <div
              className="flex transform-gpu transition-transform duration-[7500ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
              style={{
                width: viewportW ? viewportW * 3 : "300%",
                transform: trackTransform,
              }}
            >
              {/* STEP 1 */}
              <div className={`shrink-0 px-7 box-border transition-all duration-[900ms] ease-out ${isSliding ? "opacity-85 scale-[0.995]" : "opacity-100 scale-100"}`} style={{ width: viewportW || "100%" }}>
                <StepShell
                  title="tell us about yourself"
                  description="provide context about your work, style, and goals. this helps blackbox understand your creative direction."
                >
                  <div className="space-y-4">
                    <textarea
                      placeholder="i'm a recording artist focused on..."
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      className="min-h-[200px] w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase resize-none px-3 py-2"
                    />
                    <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase">{context.length} characters</p>
                  </div>
                </StepShell>
              </div>

              {/* STEP 2 */}
              <div className={`shrink-0 px-7 box-border transition-all duration-[900ms] ease-out ${isSliding ? "opacity-85 scale-[0.995]" : "opacity-100 scale-100"}`} style={{ width: viewportW || "100%" }}>
                <StepShell
                  title="direction & intent"
                  description="give us your next target and where you're at. this helps blackbox generate plans that fit how you move."
                >
                  <div className="space-y-8">
                    <FieldBlock label="primary goal (next 90 days)">
                      <textarea
                        placeholder='ex: "consistent releases" / "grow tiktok discovery"'
                        value={primaryGoal}
                        onChange={(e) => setPrimaryGoal(e.target.value)}
                        className="min-h-[120px] w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase resize-none px-3 py-2"
                      />
                      <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase">{primaryGoal.length} characters</p>
                    </FieldBlock>

                    <FieldBlock label="genre / sound">
                      <input
                        placeholder='ex: "dark r&b"'
                        value={genreSound}
                        onChange={(e) => setGenreSound(e.target.value)}
                        className="h-11 w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase px-3"
                      />
                    </FieldBlock>

                    <div className="space-y-4">
                      <label className="text-xs font-mono tracking-tight text-zinc-500 lowercase">career stage</label>
                      <div className="flex flex-wrap gap-2">
                        <StagePill active={careerStage === "early"} onClick={() => setCareerStage("early")}>
                          early
                        </StagePill>
                        <StagePill active={careerStage === "building"} onClick={() => setCareerStage("building")}>
                          building
                        </StagePill>
                        <StagePill active={careerStage === "momentum"} onClick={() => setCareerStage("momentum")}>
                          momentum
                        </StagePill>
                        <StagePill active={careerStage === "breakout"} onClick={() => setCareerStage("breakout")}>
                          breakout
                        </StagePill>
                        <StagePill active={careerStage === "pro"} onClick={() => setCareerStage("pro")}>
                          pro
                        </StagePill>
                      </div>
                    </div>
                  </div>
                </StepShell>
              </div>

              {/* STEP 3 */}
              <div className={`shrink-0 px-7 box-border transition-all duration-[900ms] ease-out ${isSliding ? "opacity-85 scale-[0.995]" : "opacity-100 scale-100"}`} style={{ width: viewportW || "100%" }}>
                <StepShell
                  title="how you move"
                  description="this is where blackbox starts learning your patterns — strengths, friction, and constraints."
                >
                  <div className="space-y-7">
                    <FieldBlock label="strengths (what you do naturally)">
                      <textarea
                        placeholder='ex: "making music consistently, visuals, moody branding"'
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        className="min-h-[110px] w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase resize-none px-3 py-2"
                      />
                    </FieldBlock>

                    <FieldBlock label="weaknesses (what slows you down)">
                      <textarea
                        placeholder='ex: "posting consistency, outreach, overthinking"'
                        value={weaknesses}
                        onChange={(e) => setWeaknesses(e.target.value)}
                        className="min-h-[110px] w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase resize-none px-3 py-2"
                      />
                    </FieldBlock>

                    <FieldBlock label="constraints (time/money/energy)">
                      <textarea
                        placeholder='ex: "2 hours/day, low budget, i burn out if i post daily"'
                        value={constraints}
                        onChange={(e) => setConstraints(e.target.value)}
                        className="min-h-[110px] w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase resize-none px-3 py-2"
                      />
                    </FieldBlock>

                    <FieldBlock label="current focus (next 30 days)">
                      <input
                        placeholder='ex: "release idea 001 + build tiktok discovery"'
                        value={currentFocus}
                        onChange={(e) => setCurrentFocus(e.target.value)}
                        className="h-11 w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase px-3"
                      />
                    </FieldBlock>
                  </div>
                </StepShell>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleBack}
              variant="ghost"
              className="h-11 px-3 text-zinc-700 hover:text-zinc-500 hover:bg-transparent font-mono text-sm tracking-tight lowercase"
              disabled={step === 1}
            >
              back
            </Button>

            <Button
              type="button"
              onClick={handleContinue}
              variant="outline"
              className="flex-1 h-11 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight uppercase"
            >
              {step === 3 ? "finish" : "continue"}
            </Button>

            <Button
              type="button"
              onClick={handleSkip}
              variant="ghost"
              className="h-11 px-6 text-zinc-600 hover:text-zinc-400 hover:bg-transparent font-mono text-sm tracking-tight lowercase"
            >
              skip
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2">
            <div className={`h-1 w-8 rounded-full ${step === 1 ? "bg-zinc-700" : "bg-zinc-800"}`} />
            <div className={`h-1 w-8 rounded-full ${step === 2 ? "bg-zinc-700" : "bg-zinc-800"}`} />
            <div className={`h-1 w-8 rounded-full ${step === 3 ? "bg-zinc-700" : "bg-zinc-800"}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-inter font-black tracking-tight text-white lowercase">{title}</h2>
        <p className="text-sm font-mono tracking-tight text-zinc-400 lowercase leading-relaxed">{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-mono tracking-tight text-zinc-500 lowercase">{label}</label>
      {children}
    </div>
  );
}

function StagePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-10 px-4 rounded-md border transition-colors font-mono text-sm tracking-tight lowercase",
        active
          ? "bg-zinc-900/40 border-zinc-600 text-white"
          : "bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}