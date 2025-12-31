"use client"

import { useState } from "react"
import Link from "next/link"

export default function OnboardingPreferencesPage() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  const goals = [
    "portfolio tracking",
    "career insights",
    "market analysis",
    "skill development",
    "network expansion",
    "exhibition planning",
  ]

  const tools = ["social media", "galleries", "art fairs", "direct sales", "commissions", "residencies"]

  const toggleSelection = (item: string, list: string[], setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item))
    } else {
      setter([...list, item])
    }
  }

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
            <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">setup / preferences</p>
          </div>

          {/* Onboarding Form */}
          <div className="space-y-12">
            {/* Goals Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-inter font-black tracking-tight text-white lowercase">
                  what are your goals?
                </h2>
                <p className="text-sm font-mono tracking-tight text-zinc-400 lowercase leading-relaxed">
                  select all that apply
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleSelection(goal, selectedGoals, setSelectedGoals)}
                    className={`h-12 px-4 border rounded text-sm font-mono tracking-tight lowercase transition-all ${
                      selectedGoals.includes(goal)
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-inter font-black tracking-tight text-white lowercase">
                  how do you connect?
                </h2>
                <p className="text-sm font-mono tracking-tight text-zinc-400 lowercase leading-relaxed">
                  choose your primary channels
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {tools.map((tool) => (
                  <button
                    key={tool}
                    onClick={() => toggleSelection(tool, selectedTools, setSelectedTools)}
                    className={`h-12 px-4 border rounded text-sm font-mono tracking-tight lowercase transition-all ${
                      selectedTools.includes(tool)
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link
                href="/onboarding/context"
                className="h-11 px-6 text-zinc-600 hover:text-zinc-400 font-mono text-sm tracking-tight lowercase flex items-center justify-center transition-colors"
              >
                back
              </Link>
              <Link
                href="/onboarding/complete"
                className="flex-1 h-11 bg-transparent border border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight uppercase flex items-center justify-center rounded"
              >
                CONTINUE
              </Link>
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
  )
}
