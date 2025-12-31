"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function OnboardingPage2() {
  const router = useRouter();
  const supabase = createClient();

  const [primaryGoal, setPrimaryGoal] = useState("");
  const [genre, setGenre] = useState("");
  const [careerStage, setCareerStage] = useState<
    "starting" | "building" | "momentum" | "scaling" | "established"
  >("building");

  async function handleContinue() {
    // 1) get the logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If not logged in, send them back to login
    if (userError || !user) {
      console.error(userError);
      router.push("/");
      return;
    }

    // 2) Guard: email is required because profiles.email is NOT NULL
    if (!user.email) {
      alert("No email found for this user session.");
      router.push("/");
      return;
    }

    // 3) Save page 2 fields to profiles (upsert by user id)
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          primary_goal: primaryGoal,
          genre,
          career_stage: careerStage,
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    // 4) Next step (we'll build page 3 next)
    router.push("/onboarding/page-3");
  }

  function handleSkip() {
    router.push("/onboarding/page-3");
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* 3D Void Vignette Effect - matching login page */}
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
            background:
              "radial-gradient(ellipse 60% 50% at center, rgba(40,40,40,0.2) 0%, transparent 60%)",
            boxShadow: "inset 0 0 200px 100px rgba(0,0,0,0.9)",
          }}
        />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-[600px] space-y-12">
          {/* Brand Header */}
          <div className="text-center space-y-4">
            <Link href="/">
              <h1 className="text-6xl font-inter font-black tracking-[-0.08em] text-white lowercase cursor-pointer hover:text-zinc-200 transition-colors">
                blackbox<span className="text-4xl">.</span>
              </h1>
            </Link>
            <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">setup / direction</p>
          </div>

          {/* Onboarding Form */}
          <div className="space-y-8">
            {/* Instructions */}
            <div className="space-y-3">
              <h2 className="text-2xl font-inter font-black tracking-tight text-white lowercase">
                direction & intent
              </h2>
              <p className="text-sm font-mono tracking-tight text-zinc-400 lowercase leading-relaxed">
                give us your next target and where you’re at. this helps blackbox generate plans that fit how you move.
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-6">
              {/* Primary goal (textarea) */}
              <div className="space-y-3">
                <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">primary goal (next 90 days)</p>
                <textarea
                  placeholder={`ex: "consistent releases" / "grow tiktok discovery"`}
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="min-h-[120px] w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase resize-none px-3 py-2"
                />
                <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase">
                  {primaryGoal.length} characters
                </p>
              </div>

              {/* Genre (input) */}
              <div className="space-y-3">
                <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">genre / sound</p>
                <input
                  type="text"
                  placeholder={`ex: "dark r&b"`}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="h-11 w-full rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase px-3"
                />
              </div>

              {/* Career stage (pills) */}
              <div className="space-y-3">
                <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">career stage</p>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["starting", "starting out"],
                      ["building", "building foundation"],
                      ["momentum", "gaining momentum"],
                      ["scaling", "scaling up"],
                      ["established", "established"],
                    ] as const
                  ).map(([value, label]) => {
                    const active = careerStage === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCareerStage(value)}
                        className={
                          "h-10 px-4 rounded-md border font-mono text-xs lowercase tracking-tight transition-colors " +
                          (active
                            ? "border-zinc-600 bg-zinc-900/50 text-zinc-100"
                            : "border-zinc-800 bg-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700")
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleContinue}
                variant="outline"
                className="flex-1 h-11 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight uppercase"
              >
                CONTINUE
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
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-8 bg-zinc-700 rounded-full" />
            <div className="h-1 w-8 bg-zinc-700 rounded-full" />
            <div className="h-1 w-8 bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}