"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { createCampaignFromProfile } from "@/app/onboarding/actions";

// --- Types ---

type CareerStage = "early" | "building" | "momentum" | "breakout" | "pro";
type ContentActivity = "regular" | "sometimes" | "rarely" | "never";
type ReleaseStatus = "regular" | "few" | "unreleased" | "first";

export type InitialProfile = {
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
  artist_archetype?: string;
  visibility_style?: string;
  release_philosophy?: string;
  audience_relationship?: string;
  reference_artists?: string;
  role?: string;
  project_status?: string;
  readiness_checklist?: string[];
  campaign_goals?: string[];
  primary_blocker?: string;
};

type PanelId =
  | "role"
  | "sound"
  | "project_status"
  | "readiness"
  | "goals"
  | "producer_goals"
  | "catalog"
  | "blocker"
  | "constraints"
  | "interpretation";

// --- Panel sequence ---

function buildPanelSequence(role: string, projectStatus: string): PanelId[] {
  if (!role) return ["role"];
  const normalizedStatus = projectStatus === "other" ? "between" : projectStatus;
  const isProducer = role === "producer";
  const isArtist =
    role === "artist" || role === "both" || role === "songwriter";

  if (isProducer) {
    return [
      "role",
      "sound",
      "producer_goals",
      "catalog",
      "blocker",
      "constraints",
      "interpretation",
    ];
  }
  if (isArtist) {
    const base: PanelId[] = ["role", "sound", "project_status"];
    if (!normalizedStatus) return base;
    if (normalizedStatus === "ready")
      return [...base, "readiness", "goals", "constraints", "interpretation"];
    return [...base, "goals", "constraints", "interpretation"];
  }
  return [
    "role",
    "sound",
    "project_status",
    "goals",
    "constraints",
    "interpretation",
  ];
}

// --- Option constants (value, label) ---

const READINESS_OPTIONS: { value: string; label: string }[] = [
  { value: "music_finished", label: "music is finished and mastered" },
  {
    value: "uploaded_distributor",
    label: "uploaded to distributor (DistroKid, TuneCore, etc.)",
  },
  {
    value: "live_on_platforms",
    label: "live on Spotify / Apple Music already",
  },
  {
    value: "spotify_editorial",
    label: "submitted to Spotify for Artists editorial",
  },
  { value: "presave_ready", label: "pre-save link is set up" },
  { value: "content_plan", label: "content plan is ready" },
  { value: "curator_outreach", label: "curator outreach started" },
  { value: "fan_email_ready", label: "fan email / SMS list ready to send" },
];

const GOALS_OPTIONS: { value: string; label: string }[] = [
  { value: "streams", label: "more streams and algorithm traction" },
  { value: "playlists", label: "playlist placements (editorial or curated)" },
  { value: "audience_growth", label: "growing my audience / new followers" },
  { value: "fan_depth", label: "deepening connection with existing fans" },
  { value: "press", label: "getting on blogs or press" },
  { value: "revenue", label: "revenue (streams, merch, tickets)" },
  { value: "label_attention", label: "getting in front of labels or A&Rs" },
  { value: "other", label: "other..." },
];

const PRODUCER_GOALS_OPTIONS: { value: string; label: string }[] = [
  {
    value: "beat_sales",
    label: "sell beats online (BeatStars, Airbit, etc.)",
  },
  {
    value: "indie_placements",
    label: "get placements with independent artists",
  },
  {
    value: "major_placements",
    label: "get placements with major / signed artists",
  },
  { value: "sync", label: "license music for sync (TV, film, ads, games)" },
  {
    value: "producer_brand",
    label: "build my producer brand / get recognized",
  },
  {
    value: "collabs",
    label: "collab with other producers or artists",
  },
  { value: "other", label: "other..." },
];

const CATALOG_OPTIONS: { value: string; label: string }[] = [
  { value: "ready", label: "i have tracks ready to send to artists now" },
  { value: "building", label: "i'm still building / refining my sound" },
  { value: "has_placements", label: "i have placements already, want more" },
  { value: "large_catalog", label: "i have a large catalog, just need strategy" },
  { value: "other", label: "other..." },
];

const BLOCKER_OPTIONS: { value: string; label: string }[] = [
  { value: "reach", label: "i don't know how to reach the right people" },
  { value: "not_ready", label: "my music isn't ready yet" },
  { value: "time", label: "i don't have the time to be consistent" },
  { value: "unclear", label: "i don't know what's actually working" },
  { value: "no_presence", label: "i have no online presence / brand yet" },
  { value: "other", label: "other..." },
];

const CONSTRAINTS_OPTIONS: { value: string; label: string }[] = [
  {
    value: "limited_time",
    label: "very limited time (less than 5 hrs/week)",
  },
  { value: "no_budget", label: "little to no budget right now" },
  { value: "solo", label: "i work alone — no team" },
  { value: "inconsistent", label: "i struggle with consistency" },
  {
    value: "unclear_metrics",
    label: "i don't know what's actually moving the needle",
  },
];

// --- Component ---

const SLIDE_MS = 900;

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
  const [panelIndex, setPanelIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [interpretation, setInterpretation] = useState("");
  const [isGeneratingInterpretation, setIsGeneratingInterpretation] =
    useState(false);

  const [role, setRole] = useState(initialProfile.role ?? "");
  const [genreSound, setGenreSound] = useState(initialProfile.genre_sound ?? "");
  const [projectStatus, setProjectStatus] = useState(
    initialProfile.project_status ?? ""
  );
  const [readinessChecklist, setReadinessChecklist] = useState<string[]>(
    initialProfile.readiness_checklist ?? []
  );
  const [campaignGoals, setCampaignGoals] = useState<string[]>(
    initialProfile.campaign_goals ?? []
  );
  const [producerGoals, setProducerGoals] = useState<string[]>([]);
  const [catalogStatus, setCatalogStatus] = useState("");
  const [primaryBlocker, setPrimaryBlocker] = useState(
    initialProfile.primary_blocker ?? ""
  );
  const [constraints, setConstraints] = useState<string[]>(() => {
    const c = (initialProfile as { constraints?: string | string[] })
      .constraints;
    if (Array.isArray(c)) return c;
    if (typeof c === "string" && c) {
      try {
        const p = JSON.parse(c);
        return Array.isArray(p) ? p : [];
      } catch {
        return c
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  });

  const [projectStatusOther, setProjectStatusOther] = useState("");
  const [goalsOther, setGoalsOther] = useState("");
  const [producerGoalsOther, setProducerGoalsOther] = useState("");
  const [catalogOther, setCatalogOther] = useState("");
  const [blockerOther, setBlockerOther] = useState("");
  const [constraintsOther, setConstraintsOther] = useState("");

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportW, setViewportW] = useState(0);

  const panelSequence = buildPanelSequence(role, projectStatus);
  const currentPanelId = panelSequence[panelIndex];

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportW(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const trackTransform = `translate3d(-${panelIndex * viewportW}px, 0, 0)`;

  const upsertProfile = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!userId) return { ok: false as const, message: "No user session found." };
      if (!userEmail)
        return { ok: false as const, message: "No email found for this user session." };
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, email: userEmail, ...payload },
          { onConflict: "id" }
        );
      if (error) return { ok: false as const, message: error.message };
      return { ok: true as const, message: "" };
    },
    [supabase, userId, userEmail]
  );

  const generateInterpretation = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch("/api/onboarding/interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          genreSound,
          projectStatus: projectStatus || catalogStatus,
          readinessChecklist,
          campaignGoals:
            campaignGoals.length > 0 ? campaignGoals : producerGoals,
          primaryBlocker,
          constraints,
        }),
      });
      const data = await response.json();
      return (
        data.interpretation ||
        "BLACKBOX has your profile. Your first move is ready."
      );
    } catch {
      return "BLACKBOX has your profile. Your first move is ready.";
    }
  }, [
    role,
    genreSound,
    projectStatus,
    catalogStatus,
    readinessChecklist,
    campaignGoals,
    producerGoals,
    primaryBlocker,
    constraints,
  ]);

  const slide = useCallback((toIndex: number) => {
    setIsSliding(true);
    setPanelIndex(toIndex);
    setTimeout(() => setIsSliding(false), SLIDE_MS);
  }, []);

  const handleBack = useCallback(() => {
    if (panelIndex === 0) return;
    slide(panelIndex - 1);
  }, [panelIndex, slide]);

  async function resolveDestination(): Promise<string> {
    await upsertProfile({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
    const isArtistOrBoth = role === "artist" || role === "both";
    const isReadyOrInProgress =
      projectStatus === "ready" || projectStatus === "in_progress";
    if (isArtistOrBoth && isReadyOrInProgress) {
      try {
        const { id } = await createCampaignFromProfile();
        return '/dashboard';
      } catch {
        return "/dashboard";
      }
    }
    return "/dashboard";
  }

  async function handleEnterBlackbox() {
    const destination = await resolveDestination()
    window.location.assign(destination)
  }

  const toggleMulti = useCallback(
    (
      arr: string[],
      setArr: React.Dispatch<React.SetStateAction<string[]>>,
      value: string
    ) => {
      setArr((prev) =>
        prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
      );
    },
    []
  );

  async function handleContinue() {
    const currentPanel = panelSequence[panelIndex];
    const nextPanelId = panelSequence[panelIndex + 1];

    if (currentPanel === "role") {
      const res = await upsertProfile({ role: role || null });
      if (!res.ok) return alert(res.message);
    }
    if (currentPanel === "sound") {
      const res = await upsertProfile({ genre_sound: genreSound || null });
      if (!res.ok) return alert(res.message);
    }
    if (currentPanel === "project_status") {
      const val =
        projectStatus === "other"
          ? (projectStatusOther.trim() || "other")
          : projectStatus;
      const res = await upsertProfile({ project_status: val || null });
      if (!res.ok) return alert(res.message);
    }
    if (currentPanel === "readiness") {
      const res = await upsertProfile({
        readiness_checklist:
          readinessChecklist.length > 0
            ? JSON.stringify(readinessChecklist)
            : null,
      });
      if (!res.ok) return alert(res.message);
    }
    if (currentPanel === "goals") {
      const final = campaignGoals.map((g) =>
        g === "other" && goalsOther.trim() ? goalsOther.trim() : g
      );
      const res = await upsertProfile({
        campaign_goals: final.length > 0 ? JSON.stringify(final) : null,
      });
      if (!res.ok) return alert(res.message);
    }
    if (currentPanel === "producer_goals") {
      const final = producerGoals.map((g) =>
        g === "other" && producerGoalsOther.trim()
          ? producerGoalsOther.trim()
          : g
      );
      const res = await upsertProfile({
        campaign_goals: final.length > 0 ? JSON.stringify(final) : null,
      });
      if (!res.ok) return alert(res.message);
    }
    if (currentPanel === "catalog") {
      const val =
        catalogStatus === "other"
          ? (catalogOther.trim() || "other")
          : catalogStatus;
      const res = await upsertProfile({ project_status: val || null });
      if (!res.ok) return alert(res.message);
    }
    if (currentPanel === "blocker") {
      const val =
        primaryBlocker === "other"
          ? (blockerOther.trim() || "other")
          : primaryBlocker;
      const res = await upsertProfile({ primary_blocker: val || null });
      if (!res.ok) return alert(res.message);
    }
    if (currentPanel === "constraints") {
      const finalConstraints = constraints.map((c) =>
        c === "other" && constraintsOther.trim() ? constraintsOther.trim() : c
      );
      const res = await upsertProfile({
        constraints: finalConstraints.join(", "),
      });
      if (!res.ok) return alert(res.message);
    }

    if (nextPanelId === "interpretation") {
      setIsGeneratingInterpretation(true);
      slide(panelIndex + 1);
      const text = await generateInterpretation();
      setInterpretation(text);
      setIsGeneratingInterpretation(false);
      return;
    }

    slide(panelIndex + 1);
  }

  const previewSequence = buildPanelSequence(role || 'artist', projectStatus || 'ready');
  const stepMeta = `step ${panelIndex + 1} of ${previewSequence.length}`;

  return (
    <div
      className="relative min-h-screen w-full overflow-y-auto"
      style={{ background: "#0c0c0e" }}
    >
      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-[600px] flex flex-col flex-1">
          <div className="text-center space-y-4 shrink-0">
            <Logo size="lg" href="/" />
            <StepCounter meta={stepMeta} />
          </div>

          <div
            ref={viewportRef}
            className="relative overflow-hidden flex-1 min-h-0 px-[1px]"
          >
            <div
              className="flex transform-gpu will-change-transform transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: viewportW
                  ? viewportW * panelSequence.length
                  : "100%",
                transform: trackTransform,
              }}
            >
              {panelSequence.map((panelId) => (
                <div
                  key={panelId}
                  className={`shrink-0 px-7 box-border transition-all duration-[400ms] ease-out ${
                    isSliding
                      ? "opacity-85 scale-[0.995]"
                      : "opacity-100 scale-100"
                  }`}
                  style={{ width: viewportW || "100%" }}
                >
                  <AnimatePresence mode="wait">
                    {currentPanelId === panelId && (
                      <PanelContent
                        panelId={panelId}
                        role={role}
                        setRole={setRole}
                        genreSound={genreSound}
                        setGenreSound={setGenreSound}
                        projectStatus={projectStatus}
                        setProjectStatus={setProjectStatus}
                        projectStatusOther={projectStatusOther}
                        setProjectStatusOther={setProjectStatusOther}
                        readinessChecklist={readinessChecklist}
                        toggleReadiness={(v) =>
                          toggleMulti(
                            readinessChecklist,
                            setReadinessChecklist,
                            v
                          )
                        }
                        campaignGoals={campaignGoals}
                        setCampaignGoals={setCampaignGoals}
                        goalsOther={goalsOther}
                        setGoalsOther={setGoalsOther}
                        producerGoals={producerGoals}
                        setProducerGoals={setProducerGoals}
                        producerGoalsOther={producerGoalsOther}
                        setProducerGoalsOther={setProducerGoalsOther}
                        catalogStatus={catalogStatus}
                        setCatalogStatus={setCatalogStatus}
                        catalogOther={catalogOther}
                        setCatalogOther={setCatalogOther}
                        primaryBlocker={primaryBlocker}
                        setPrimaryBlocker={setPrimaryBlocker}
                        blockerOther={blockerOther}
                        setBlockerOther={setBlockerOther}
                        constraints={constraints}
                        setConstraints={setConstraints}
                        toggleConstraint={(v) =>
                          toggleMulti(constraints, setConstraints, v)
                        }
                        constraintsOther={constraintsOther}
                        setConstraintsOther={setConstraintsOther}
                        interpretation={interpretation}
                        isGeneratingInterpretation={isGeneratingInterpretation}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={panelIndex === 0}
              className="shrink-0 font-mono text-sm tracking-tight lowercase text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-0 disabled:pointer-events-none w-10"
            >
              back
            </button>
            <Button
              type="button"
              onClick={
                currentPanelId === "interpretation"
                  ? handleEnterBlackbox
                  : handleContinue
              }
              variant="outline"
              disabled={
                isFinishing ||
                isGeneratingInterpretation ||
                (currentPanelId === "interpretation" && !interpretation)
              }
              className="btn-lift flex-1 h-11 min-h-[44px] bg-transparent border-zinc-800 text-zinc-300 font-inter font-black tracking-tight uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentPanelId === "interpretation"
                ? "enter blackbox →"
                : isFinishing
                  ? "saving..."
                  : isGeneratingInterpretation
                    ? "thinking..."
                    : "continue"}
            </Button>
            <div className="shrink-0 w-10" />
          </div>

          <div className="flex items-center justify-center gap-2 shrink-0 mt-6">
            {panelSequence.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === panelIndex ? "bg-zinc-500" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Panel content ---

function PanelContent({
  panelId,
  role,
  setRole,
  genreSound,
  setGenreSound,
  projectStatus,
  setProjectStatus,
  projectStatusOther,
  setProjectStatusOther,
  readinessChecklist,
  toggleReadiness,
  campaignGoals,
  setCampaignGoals,
  goalsOther,
  setGoalsOther,
  producerGoals,
  setProducerGoals,
  producerGoalsOther,
  setProducerGoalsOther,
  catalogStatus,
  setCatalogStatus,
  catalogOther,
  setCatalogOther,
  primaryBlocker,
  setPrimaryBlocker,
  blockerOther,
  setBlockerOther,
  constraints,
  setConstraints,
  toggleConstraint,
  constraintsOther,
  setConstraintsOther,
  interpretation,
  isGeneratingInterpretation,
}: {
  panelId: PanelId;
  role: string;
  setRole: (r: string) => void;
  genreSound: string;
  setGenreSound: (s: string) => void;
  projectStatus: string;
  setProjectStatus: (s: string) => void;
  projectStatusOther: string;
  setProjectStatusOther: (s: string) => void;
  readinessChecklist: string[];
  toggleReadiness: (v: string) => void;
  campaignGoals: string[];
  setCampaignGoals: React.Dispatch<React.SetStateAction<string[]>>;
  goalsOther: string;
  setGoalsOther: (s: string) => void;
  producerGoals: string[];
  setProducerGoals: React.Dispatch<React.SetStateAction<string[]>>;
  producerGoalsOther: string;
  setProducerGoalsOther: (s: string) => void;
  catalogStatus: string;
  setCatalogStatus: (s: string) => void;
  catalogOther: string;
  setCatalogOther: (s: string) => void;
  primaryBlocker: string;
  setPrimaryBlocker: (s: string) => void;
  blockerOther: string;
  setBlockerOther: (s: string) => void;
  constraints: string[];
  setConstraints: React.Dispatch<React.SetStateAction<string[]>>;
  toggleConstraint: (v: string) => void;
  constraintsOther: string;
  setConstraintsOther: (s: string) => void;
  interpretation: string;
  isGeneratingInterpretation: boolean;
}) {
  const [typedInterpretation, setTypedInterpretation] = useState("");

  useEffect(() => {
    if (!interpretation || isGeneratingInterpretation) {
      setTypedInterpretation("");
      return;
    }

    setTypedInterpretation("");
    let index = 0;
    const step = 3; // reveal a few characters at a time for a rapid feel
    const interval = window.setInterval(() => {
      index += step;
      if (index >= interpretation.length) {
        setTypedInterpretation(interpretation);
        window.clearInterval(interval);
      } else {
        setTypedInterpretation(interpretation.slice(0, index));
      }
    }, 20);

    return () => {
      window.clearInterval(interval);
    };
  }, [interpretation, isGeneratingInterpretation]);
  if (panelId === "role") {
    return (
      <StepShell
        title="what do you do?"
        description="this shapes everything blackbox builds for you."
      >
        <PillGrid trigger="role">
          <StagePill active={role === "artist"} onClick={() => setRole("artist")}>
            i'm an artist — i perform and release music
          </StagePill>
          <StagePill active={role === "producer"} onClick={() => setRole("producer")}>
            i'm a producer — i make beats and place them
          </StagePill>
          <StagePill active={role === "both"} onClick={() => setRole("both")}>
            i do both — i produce and release my own stuff
          </StagePill>
          <StagePill active={role === "songwriter"} onClick={() => setRole("songwriter")}>
            i write for other artists
          </StagePill>
        </PillGrid>
      </StepShell>
    );
  }

  if (panelId === "sound") {
    return (
      <StepShell
        title="what's your sound?"
        description="describe your music like you'd explain it to someone who's never heard you."
      >
        <FieldBlock label="">
          <AutoExpandTextarea
            placeholder='ex: "dark r&b / experimental" or "melodic trap, cinematic"'
            value={genreSound}
            onChange={setGenreSound}
            minHeight={100}
            maxHeight={200}
          />
        </FieldBlock>
      </StepShell>
    );
  }

  if (panelId === "project_status") {
    return (
      <StepShell
        title="where are you at right now?"
        description="be honest — blackbox meets you where you actually are."
      >
        <div className="space-y-4">
          <FieldBlock label="">
            <PillGrid trigger="project_status">
              <StagePill active={projectStatus === "ready"} onClick={() => setProjectStatus("ready")}>
                i have something ready to release or just released
              </StagePill>
              <StagePill active={projectStatus === "in_progress"} onClick={() => setProjectStatus("in_progress")}>
                i'm working on something, not ready yet
              </StagePill>
              <StagePill active={projectStatus === "between"} onClick={() => setProjectStatus("between")}>
                i have a catalog but i'm between projects
              </StagePill>
              <StagePill active={projectStatus === "starting"} onClick={() => setProjectStatus("starting")}>
                i'm just starting out — building from scratch
              </StagePill>
              <StagePill active={projectStatus === "other"} onClick={() => setProjectStatus("other")}>
                other...
              </StagePill>
            </PillGrid>
          </FieldBlock>
          {projectStatus === "other" && (
            <OtherTextInput
              value={projectStatusOther}
              onChange={setProjectStatusOther}
              placeholder="describe your situation..."
            />
          )}
        </div>
      </StepShell>
    );
  }

  if (panelId === "readiness") {
    return (
      <StepShell
        title="what's already done?"
        description="check everything you've already handled — blackbox skips what's done."
      >
        <FieldBlock label="">
          <PillGrid trigger="readiness">
            {READINESS_OPTIONS.map((opt) => (
              <ActivityPill
                key={opt.value}
                active={readinessChecklist.includes(opt.value)}
                onClick={() => toggleReadiness(opt.value)}
              >
                {opt.label}
              </ActivityPill>
            ))}
          </PillGrid>
        </FieldBlock>
      </StepShell>
    );
  }

  if (panelId === "goals") {
    return (
      <StepShell
        title="what does success look like?"
        description="for this release or phase — pick everything that applies."
      >
        <div className="space-y-4">
          <FieldBlock label="">
            <PillGrid trigger="goals">
              {GOALS_OPTIONS.map((opt) => (
                <ActivityPill
                  key={opt.value}
                  active={campaignGoals.includes(opt.value)}
                  onClick={() =>
                    setCampaignGoals((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((x) => x !== opt.value)
                        : [...prev, opt.value]
                    )
                  }
                >
                  {opt.label}
                </ActivityPill>
              ))}
            </PillGrid>
          </FieldBlock>
          {campaignGoals.includes("other") && (
            <OtherTextInput
              value={goalsOther}
              onChange={setGoalsOther}
              placeholder="describe your situation..."
            />
          )}
        </div>
      </StepShell>
    );
  }

  if (panelId === "producer_goals") {
    return (
      <StepShell
        title="what are you trying to do?"
        description="pick everything that applies to your situation."
      >
        <div className="space-y-4">
          <FieldBlock label="">
            <PillGrid trigger="producer_goals">
              {PRODUCER_GOALS_OPTIONS.map((opt) => (
                <ActivityPill
                  key={opt.value}
                  active={producerGoals.includes(opt.value)}
                  onClick={() =>
                    setProducerGoals((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((x) => x !== opt.value)
                        : [...prev, opt.value]
                    )
                  }
                >
                  {opt.label}
                </ActivityPill>
              ))}
            </PillGrid>
          </FieldBlock>
          {producerGoals.includes("other") && (
            <OtherTextInput
              value={producerGoalsOther}
              onChange={setProducerGoalsOther}
              placeholder="describe your situation..."
            />
          )}
        </div>
      </StepShell>
    );
  }

  if (panelId === "catalog") {
    return (
      <StepShell
        title="where's your production at?"
        description="be honest about where things actually stand."
      >
        <div className="space-y-4">
          <FieldBlock label="">
            <PillGrid trigger="catalog">
              {CATALOG_OPTIONS.map((opt) => (
                <StagePill
                  key={opt.value}
                  active={catalogStatus === opt.value}
                  onClick={() => setCatalogStatus(opt.value)}
                >
                  {opt.label}
                </StagePill>
              ))}
            </PillGrid>
          </FieldBlock>
          {catalogStatus === "other" && (
            <OtherTextInput
              value={catalogOther}
              onChange={setCatalogOther}
              placeholder="describe your situation..."
            />
          )}
        </div>
      </StepShell>
    );
  }

  if (panelId === "blocker") {
    return (
      <StepShell
        title="what's holding you back right now?"
        description="the thing that's actually in the way right now."
      >
        <div className="space-y-4">
          <FieldBlock label="">
            <PillGrid trigger="blocker">
              {BLOCKER_OPTIONS.map((opt) => (
                <StagePill
                  key={opt.value}
                  active={primaryBlocker === opt.value}
                  onClick={() => setPrimaryBlocker(opt.value)}
                >
                  {opt.label}
                </StagePill>
              ))}
            </PillGrid>
          </FieldBlock>
          {primaryBlocker === "other" && (
            <OtherTextInput
              value={blockerOther}
              onChange={setBlockerOther}
              placeholder="describe your situation..."
            />
          )}
        </div>
      </StepShell>
    );
  }

  if (panelId === "constraints") {
    return (
      <StepShell
        title="real constraints"
        description="what's actually limiting you right now?"
      >
        <div className="space-y-4">
          <FieldBlock label="">
            <PillGrid trigger="constraints">
              {CONSTRAINTS_OPTIONS.map((opt) => (
                <ActivityPill
                  key={opt.value}
                  active={constraints.includes(opt.value)}
                  onClick={() => toggleConstraint(opt.value)}
                >
                  {opt.label}
                </ActivityPill>
              ))}
              <ActivityPill
                active={constraints.includes("other")}
                onClick={() => {
                  setConstraints((prev) =>
                    prev.includes("other")
                      ? prev.filter((c) => c !== "other")
                      : [...prev, "other"]
                  );
                }}
              >
                other...
              </ActivityPill>
            </PillGrid>
          </FieldBlock>
          {constraints.includes("other") && (
            <OtherTextInput
              value={constraintsOther}
              onChange={setConstraintsOther}
              placeholder="what else is limiting you?"
            />
          )}
        </div>
      </StepShell>
    );
  }

  if (panelId === "interpretation") {
    return (
      <StepShell
        title="reading your situation"
        description=""
      >
        <div className="space-y-6 overflow-y-auto max-h-[300px]">
          {isGeneratingInterpretation ? (
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
              <span className="text-sm font-mono lowercase">
                blackbox is reading your situation...
              </span>
            </div>
          ) : (
            <>
              {interpretation && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {typedInterpretation.split('\n').filter(s => s.trim()).map((sentence, i) => (
                    <p key={i} className="font-mono text-sm text-zinc-300 leading-relaxed lowercase">
                      {sentence.trim()}
                    </p>
                  ))}
                </motion.div>
              )}
              <p className="font-mono text-xs text-zinc-600 lowercase">
                your first move is waiting inside.
              </p>
            </>
          )}
        </div>
      </StepShell>
    );
  }

  return null;
}

// --- UI primitives ---

function StepCounter({ meta }: { meta: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0.3, y: 2 },
      { opacity: 1, y: 0, duration: 0.25, ease: 'power1.out' }
    )
  }, [meta])
  return (
    <p
      ref={ref}
      className="text-xs lowercase tracking-tight font-mono text-zinc-500"
      style={{ opacity: 0.3 }}
    >
      {meta}
    </p>
  )
}

function PillGrid({ children, trigger }: { children: React.ReactNode; trigger: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const pills = ref.current.querySelectorAll('[data-pill]')
    gsap.fromTo(pills,
      { opacity: 0, y: 10, scale: 0.96 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out',
        stagger: { each: 0.06, from: 'start' },
        delay: 0.15,
      }
    )
  }, [trigger])
  return (
    <div ref={ref} className="flex flex-wrap gap-2">
      {children}
    </div>
  )
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const childRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline()

    tl.fromTo(titleRef.current,
      { opacity: 0.15, y: 6, filter: 'blur(2px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.38, ease: 'power2.out' }
    )
    .fromTo(descRef.current,
      { opacity: 0, y: 4 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
      '-=0.2'
    )
    .fromTo(childRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.15, ease: 'none' },
      '-=0.15'
    )
  }, [title])

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2
          ref={titleRef}
          className="text-2xl font-inter font-black tracking-tight text-white lowercase"
          style={{ opacity: 0 }}
        >
          {title}
        </h2>
        {description ? (
          <p
            ref={descRef}
            className="text-sm font-mono tracking-tight text-zinc-400 lowercase leading-relaxed"
            style={{ opacity: 0 }}
          >
            {description}
          </p>
        ) : null}
      </div>
      <div
        ref={childRef}
        style={{ opacity: 0 }}
      >
        {children}
      </div>
    </div>
  )
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {label ? (
        <label className="text-xs font-mono tracking-tight text-zinc-500 lowercase block">
          {label}
        </label>
      ) : null}
      {children}
    </div>
  );
}

function OtherTextInput({
  value,
  onChange,
  placeholder = "describe your situation...",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
      className="mt-3 h-11 w-full rounded-md bg-zinc-900/50 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-600 font-mono text-sm tracking-tight lowercase px-3 outline-none"
    />
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
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
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
      onChange={(e) => onChange(e.target.value)}
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
      data-pill=""
      onClick={onClick}
      className={[
        "btn-recess h-10 px-4 rounded-md border font-mono text-sm tracking-tight lowercase",
        active
          ? "bg-white/[0.08] border-white/50 text-white"
          : "bg-transparent border-zinc-800 text-zinc-400",
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
      data-pill=""
      onClick={onClick}
      className={[
        "btn-recess px-4 py-2.5 rounded-md border font-mono text-xs tracking-tight lowercase min-h-[44px]",
        active
          ? "bg-white/[0.08] border-white/50 text-white"
          : "bg-transparent border-zinc-800 text-zinc-400",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
