"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type CareerStage = "early" | "building" | "momentum" | "breakout" | "pro";

type OnboardingClientProps = {
  userId: string;
  userEmail: string;
  initialProfile: {
    context: string | null;
    primary_goal: string | null;
    genre_sound: string | null;
    career_stage: CareerStage | null;
    strengths: string | null;
    weaknesses: string | null;
    constraints: string | null;
    current_focus: string | null;
  };
};

export default function OnboardingClient({
  userId,
  userEmail,
  initialProfile,
}: OnboardingClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [context, setContext] = useState(initialProfile.context ?? "");

  // Step 2
  const [primaryGoal, setPrimaryGoal] = useState(initialProfile.primary_goal ?? "");
  const [genreSound, setGenreSound] = useState(initialProfile.genre_sound ?? "");
  const [careerStage, setCareerStage] = useState<CareerStage>(
    initialProfile.career_stage ?? "building"
  );

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

  const stepIndex = step - 1;
  const trackTransform =
    stepIndex === 0
      ? "translate3d(0%, 0, 0)"
      : stepIndex === 1
      ? "translate3d(-33.333333%, 0, 0)"
      : "translate3d(-66.666666%, 0, 0)";

  async function upsertProfile(payload: Record<string, any>) {
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
      setStep(2);
      return;
    }

    if (step === 2) {
      const res = await upsertProfile({
        primary_goal: primaryGoal,
        genre_sound: genreSound,
        career_stage: careerStage,
      });
      if (!res.ok) return alert(res.message);
      setStep(3);
      return;
    }

    const res = await upsertProfile({
      strengths,
      weaknesses,
      constraints,
      current_focus: currentFocus,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
    if (!res.ok) return alert(res.message);

    router.push("/dashboard");
  }

  function handleBack() {
    if (step === 1) return;
    setStep((s) => (s === 2 ? 1 : 2));
  }

  function handleSkip() {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else router.push("/dashboard");
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-[600px] space-y-12">
          <div className="w-full text-center space-y-4">
            <Link href="/">
              <h1 className="text-6xl font-inter font-black tracking-[-0.08em] text-white lowercase cursor-pointer">
                blackbox<span className="text-4xl">.</span>
              </h1>
            </Link>
            <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">
              {stepMeta.subtitle}
            </p>
          </div>

          <div className="relative overflow-hidden w-full">
            <div
              className="flex w-[300%] transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)]"
              style={{ transform: trackTransform }}
            >
              {/* steps unchanged UI */}
            </div>
          </div>

          <div className="w-full flex items-center gap-3">
            <Button onClick={handleBack} variant="ghost" disabled={step === 1}>
              back
            </Button>
            <Button onClick={handleContinue} variant="outline" className="flex-1">
              {step === 3 ? "finish" : "continue"}
            </Button>
            <Button onClick={handleSkip} variant="ghost">
              skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}