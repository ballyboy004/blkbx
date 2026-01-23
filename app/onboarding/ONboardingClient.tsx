"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type CareerStage = "early" | "building" | "momentum" | "breakout" | "pro";
type ContentActivity = "regular" | "sometimes" | "rarely" | "never";
type ReleaseStatus = "regular" | "few" | "unreleased" | "first";

type InitialProfile = {
  context: string;
  primary_goal: string;
  genre_sound: string;
  career_stage: CareerStage;
  strengths: string;
  weaknesses: string;
  constraints: string;
  current_focus: string;
  content_activity: ContentActivity;
  release_status: ReleaseStatus;
  stuck_on: string;
};

type FollowUpQuestion = {
  question: string;
  answer: string;
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
  const SLIDE_MS = 900;

  // Panel index: 0=who you are, 1=follow-ups, 2=where headed, 3=current activity, 4=how work
  const [panelIndex, setPanelIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isGeneratingFollowUps, setIsGeneratingFollowUps] = useState(false);

  // Follow-up questions
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [hasGeneratedFollowUps, setHasGeneratedFollowUps] = useState(false);

  // Panel 0 - who you are (context + genre + career stage)
  const [context, setContext] = useState(initialProfile.context ?? "");
  const [genreSound, setGenreSound] = useState(initialProfile.genre_sound ?? "");
  const [careerStage, setCareerStage] = useState<CareerStage>(initialProfile.career_stage ?? "building");

  // Panel 2 - where you're headed (goal + current focus)
  const [primaryGoal, setPrimaryGoal] = useState(initialProfile.primary_goal ?? "");
  const [currentFocus, setCurrentFocus] = useState(initialProfile.current_focus ?? "");

  // Panel 3 - current activity (NEW STRUCTURED DATA)
  const [contentActivity, setContentActivity] = useState<ContentActivity>(initialProfile.content_activity ?? "sometimes");
  const [releaseStatus, setReleaseStatus] = useState<ReleaseStatus>(initialProfile.release_status ?? "few");
  const [stuckOn, setStuckOn] = useState(initialProfile.stuck_on ?? "");

  // Panel 4 - how you work (strengths, weaknesses, constraints)
  const [strengths, setStrengths] = useState(initialProfile.strengths ?? "");
  const [weaknesses, setWeaknesses] = useState(initialProfile.weaknesses ?? "");
  const [constraints, setConstraints] = useState(initialProfile.constraints ?? "");

  const stepMeta = useMemo(() => {
    if (panelIndex === 0) return { subtitle: "setup / identity", title: "who you are" };
    if (panelIndex === 1) return { subtitle: "setup / identity", title: "who you are" };
    if (panelIndex === 2) return { subtitle: "setup / direction", title: "where you're headed" };
    if (panelIndex === 3) return { subtitle: "setup / reality", title: "what you're doing now" };
    return { subtitle: "setup / patterns", title: "how you work" };
  }, [panelIndex]);

  // Slider transform
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

  const trackTransform = `translate3d(-${panelIndex * viewportW}px, 0, 0)`;

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

  async function generateFollowUps() {
    if (context.trim().length < 20) {
      return [];
    }

    try {
      const response = await fetch('/api/onboarding/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, genre: genreSound }),
      });

      const data = await response.json();
      return data.questions || [];
    } catch (error) {
      console.error('[Onboarding] Failed to generate follow-ups:', error);
      return [];
    }
  }

  async function handleContinue() {
    // Panel 0: Save identity, generate follow-ups, slide to panel 1
    if (panelIndex === 0) {
      const res = await upsertProfile({ 
        context,
        genre_sound: genreSound,
        career_stage: careerStage,
      });
      if (!res.ok) return alert(res.message);

      // Generate follow-ups
      setIsGeneratingFollowUps(true);
      const questions = await generateFollowUps();
      setIsGeneratingFollowUps(false);
      setHasGeneratedFollowUps(true);

      if (questions.length > 0) {
        setFollowUpQuestions(questions.map((q: string) => ({ question: q, answer: '' })));
        setIsSliding(true);
        setPanelIndex(1);
        setTimeout(() => setIsSliding(false), SLIDE_MS);
      } else {
        setIsSliding(true);
        setPanelIndex(2);
        setTimeout(() => setIsSliding(false), SLIDE_MS);
      }
      return;
    }

    // Panel 1: Save follow-up answers, slide to panel 2
    if (panelIndex === 1) {
      const answeredFollowUps = followUpQuestions
        .filter(fq => fq.answer.trim())
        .map(fq => `Q: ${fq.question}\nA: ${fq.answer}`)
        .join('\n\n');

      if (answeredFollowUps) {
        const enrichedContext = `${context}\n\n---\n\n${answeredFollowUps}`;
        await upsertProfile({ context: enrichedContext });
      }

      setIsSliding(true);
      setPanelIndex(2);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
      return;
    }

    // Panel 2: Save goals
    if (panelIndex === 2) {
      const res = await upsertProfile({
        primary_goal: primaryGoal,
        current_focus: currentFocus,
      });
      if (!res.ok) return alert(res.message);
      setIsSliding(true);
      setPanelIndex(3);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
      return;
    }

    // Panel 3: Save current activity
    if (panelIndex === 3) {
      const res = await upsertProfile({
        content_activity: contentActivity,
        release_status: releaseStatus,
        stuck_on: stuckOn,
      });
      if (!res.ok) return alert(res.message);
      setIsSliding(true);
      setPanelIndex(4);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
      return;
    }

    // Panel 4: Finish
    setIsFinishing(true);
    
    const res = await upsertProfile({
      strengths,
      weaknesses,
      constraints,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
    
    if (!res.ok) {
      setIsFinishing(false);
      return alert(res.message);
    }

    window.location.assign("/dashboard");
  }

  function handleBack() {
    if (panelIndex === 0) return;
    
    setIsSliding(true);
    
    if (panelIndex === 1) {
      setPanelIndex(0);
    } else if (panelIndex === 2) {
      if (hasGeneratedFollowUps && followUpQuestions.length > 0) {
        setPanelIndex(1);
      } else {
        setPanelIndex(0);
      }
    } else {
      setPanelIndex(panelIndex - 1);
    }
    
    setTimeout(() => setIsSliding(false), SLIDE_MS);
  }

  function handleSkip() {
    if (panelIndex === 0) {
      setIsSliding(true);
      setPanelIndex(2);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
    } else if (panelIndex === 1) {
      setIsSliding(true);
      setPanelIndex(2);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
    } else if (panelIndex === 4) {
      window.location.assign("/dashboard");
    } else {
      setIsSliding(true);
      setPanelIndex(panelIndex + 1);
      setTimeout(() => setIsSliding(false), SLIDE_MS);
    }
  }

  function updateFollowUpAnswer(index: number, answer: string) {
    setFollowUpQuestions(prev => 
      prev.map((fq, i) => i === index ? { ...fq, answer } : fq)
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* Loading Overlay */}
      {isFinishing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-mono tracking-tight text-zinc-400 lowercase">creating your profile...</p>
          </div>
        </div>
      )}

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
              className="flex transform-gpu transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
              style={{
                width: viewportW ? viewportW * 5 : "500%",
                transform: trackTransform,
              }}
            >
              {/* PANEL 0 - who you are */}
              <div className={`shrink-0 px-7 box-border transition-all duration-[400ms] ease-out ${isSliding ? "opacity-85 scale-[0.995]" : "opacity-100 scale-100"}`} style={{ width: viewportW || "100%" }}>
                <StepShell
                  title="who you are"
                  description="tell us about yourself — your sound, your stage, your creative identity."
                >
                  <div className="space-y-7">
                    <FieldBlock label="about you">
                      <AutoExpandTextarea
                        placeholder="i'm a recording artist focused on..."
                        value={context}
                        onChange={setContext}
                        minHeight={120}
                        maxHeight={280}
                      />
                    </FieldBlock>

                    <FieldBlock label="genre / sound">
                      <input
                        placeholder='ex: "dark r&b" / "indie pop" / "experimental hip-hop"'
                        value={genreSound}
                        onChange={(e) => setGenreSound(e.target.value)}
                        className="h-11 w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase px-3"
                      />
                    </FieldBlock>

                    <div className="space-y-4">
                      <label className="text-xs font-mono tracking-tight text-zinc-500 lowercase">career stage</label>
                      <div className="flex flex-wrap gap-2">
                        <StagePill active={careerStage === "early"} onClick={() => setCareerStage("early")}>early</StagePill>
                        <StagePill active={careerStage === "building"} onClick={() => setCareerStage("building")}>building</StagePill>
                        <StagePill active={careerStage === "momentum"} onClick={() => setCareerStage("momentum")}>momentum</StagePill>
                        <StagePill active={careerStage === "breakout"} onClick={() => setCareerStage("breakout")}>breakout</StagePill>
                        <StagePill active={careerStage === "pro"} onClick={() => setCareerStage("pro")}>pro</StagePill>
                      </div>
                    </div>
                  </div>
                </StepShell>
              </div>

              {/* PANEL 1 - follow-ups */}
              <div className={`shrink-0 px-7 box-border transition-all duration-[400ms] ease-out ${isSliding ? "opacity-85 scale-[0.995]" : "opacity-100 scale-100"}`} style={{ width: viewportW || "100%" }}>
                <StepShell
                  title="who you are"
                  description="a few quick follow-ups based on what you shared."
                >
                  <div className="space-y-6">
                    {followUpQuestions.map((fq, index) => (
                      <FieldBlock key={index} label={fq.question}>
                        <input
                          placeholder="your answer..."
                          value={fq.answer}
                          onChange={(e) => updateFollowUpAnswer(index, e.target.value)}
                          className="h-11 w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase px-3"
                        />
                      </FieldBlock>
                    ))}
                    
                    <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase pt-2">
                      these help blackbox understand your situation better.
                    </p>
                  </div>
                </StepShell>
              </div>

              {/* PANEL 2 - where you're headed */}
              <div className={`shrink-0 px-7 box-border transition-all duration-[400ms] ease-out ${isSliding ? "opacity-85 scale-[0.995]" : "opacity-100 scale-100"}`} style={{ width: viewportW || "100%" }}>
                <StepShell
                  title="where you're headed"
                  description="what are you working toward right now?"
                >
                  <div className="space-y-7">
                    <FieldBlock label="primary goal (next 90 days)">
                      <AutoExpandTextarea
                        placeholder='ex: "reach 10k streams on my next release" / "build consistent content rhythm"'
                        value={primaryGoal}
                        onChange={setPrimaryGoal}
                        minHeight={80}
                        maxHeight={180}
                      />
                    </FieldBlock>

                    <FieldBlock label="current focus (next 30 days)">
                      <AutoExpandTextarea
                        placeholder='ex: "finish and release idea 001" / "grow tiktok presence"'
                        value={currentFocus}
                        onChange={setCurrentFocus}
                        minHeight={60}
                        maxHeight={140}
                      />
                    </FieldBlock>
                  </div>
                </StepShell>
              </div>

              {/* PANEL 3 - what you're doing now (NEW STRUCTURED) */}
              <div className={`shrink-0 px-7 box-border transition-all duration-[400ms] ease-out ${isSliding ? "opacity-85 scale-[0.995]" : "opacity-100 scale-100"}`} style={{ width: viewportW || "100%" }}>
                <StepShell
                  title="what you're doing now"
                  description="this helps blackbox know where to start — not what you want to do, but what you're actually doing."
                >
                  <div className="space-y-8">
                    {/* Content Activity */}
                    <div className="space-y-4">
                      <label className="text-xs font-mono tracking-tight text-zinc-500 lowercase">content activity</label>
                      <div className="flex flex-wrap gap-2">
                        <ActivityPill 
                          active={contentActivity === "regular"} 
                          onClick={() => setContentActivity("regular")}
                        >
                          i post regularly (3+/week)
                        </ActivityPill>
                        <ActivityPill 
                          active={contentActivity === "sometimes"} 
                          onClick={() => setContentActivity("sometimes")}
                        >
                          i post sometimes
                        </ActivityPill>
                        <ActivityPill 
                          active={contentActivity === "rarely"} 
                          onClick={() => setContentActivity("rarely")}
                        >
                          i rarely post
                        </ActivityPill>
                        <ActivityPill 
                          active={contentActivity === "never"} 
                          onClick={() => setContentActivity("never")}
                        >
                          i don't post yet
                        </ActivityPill>
                      </div>
                    </div>

                    {/* Release Status */}
                    <div className="space-y-4">
                      <label className="text-xs font-mono tracking-tight text-zinc-500 lowercase">release status</label>
                      <div className="flex flex-wrap gap-2">
                        <ActivityPill 
                          active={releaseStatus === "regular"} 
                          onClick={() => setReleaseStatus("regular")}
                        >
                          i release regularly
                        </ActivityPill>
                        <ActivityPill 
                          active={releaseStatus === "few"} 
                          onClick={() => setReleaseStatus("few")}
                        >
                          i've released a few things
                        </ActivityPill>
                        <ActivityPill 
                          active={releaseStatus === "unreleased"} 
                          onClick={() => setReleaseStatus("unreleased")}
                        >
                          i have unreleased music
                        </ActivityPill>
                        <ActivityPill 
                          active={releaseStatus === "first"} 
                          onClick={() => setReleaseStatus("first")}
                        >
                          working on first release
                        </ActivityPill>
                      </div>
                    </div>

                    {/* Where stuck */}
                    <FieldBlock label="where do you feel stuck?">
                      <AutoExpandTextarea
                        placeholder='ex: "i make content but never post it" / "i post but get no engagement" / "i don't know what to make"'
                        value={stuckOn}
                        onChange={setStuckOn}
                        minHeight={70}
                        maxHeight={140}
                      />
                    </FieldBlock>
                  </div>
                </StepShell>
              </div>

              {/* PANEL 4 - how you work */}
              <div className={`shrink-0 px-7 box-border transition-all duration-[400ms] ease-out ${isSliding ? "opacity-85 scale-[0.995]" : "opacity-100 scale-100"}`} style={{ width: viewportW || "100%" }}>
                <StepShell
                  title="how you work"
                  description="what comes naturally? what slows you down? what are your real constraints?"
                >
                  <div className="space-y-7">
                    <FieldBlock label="strengths">
                      <AutoExpandTextarea
                        placeholder='ex: "making music consistently, visuals, moody branding"'
                        value={strengths}
                        onChange={setStrengths}
                        minHeight={70}
                        maxHeight={140}
                      />
                    </FieldBlock>

                    <FieldBlock label="weaknesses">
                      <AutoExpandTextarea
                        placeholder='ex: "posting consistency, outreach, overthinking my process"'
                        value={weaknesses}
                        onChange={setWeaknesses}
                        minHeight={70}
                        maxHeight={140}
                      />
                    </FieldBlock>

                    <FieldBlock label="constraints">
                      <AutoExpandTextarea
                        placeholder='ex: "2 hours a day, low budget, burn out if i try to do too much at once"'
                        value={constraints}
                        onChange={setConstraints}
                        minHeight={70}
                        maxHeight={140}
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
              disabled={panelIndex === 0}
            >
              back
            </Button>

            <Button
              type="button"
              onClick={handleContinue}
              variant="outline"
              disabled={isFinishing || isGeneratingFollowUps}
              className="flex-1 h-11 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFinishing ? "finishing..." : isGeneratingFollowUps ? "thinking..." : panelIndex === 4 ? "finish" : "continue"}
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
            <div className={`h-1 w-8 rounded-full ${panelIndex <= 1 ? "bg-zinc-700" : "bg-zinc-800"}`} />
            <div className={`h-1 w-8 rounded-full ${panelIndex === 2 ? "bg-zinc-700" : "bg-zinc-800"}`} />
            <div className={`h-1 w-8 rounded-full ${panelIndex === 3 ? "bg-zinc-700" : "bg-zinc-800"}`} />
            <div className={`h-1 w-8 rounded-full ${panelIndex === 4 ? "bg-zinc-700" : "bg-zinc-800"}`} />
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

function AutoExpandTextarea({
  placeholder,
  value,
  onChange,
  minHeight = 80,
  maxHeight = 200,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
  maxHeight?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = `${minHeight}px`;
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [minHeight, maxHeight]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
      className="w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase resize-none px-3 py-2 overflow-y-auto transition-[height] duration-150 ease-out"
    />
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

function ActivityPill({
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
        "px-4 py-2.5 rounded-md border transition-colors font-mono text-xs tracking-tight lowercase",
        active
          ? "bg-zinc-900/40 border-zinc-600 text-white"
          : "bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
