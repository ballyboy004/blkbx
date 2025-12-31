"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OnboardingCompletePage() {
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
            <h1 className="text-6xl font-inter font-black tracking-[-0.08em] text-white lowercase">
              blackbox<span className="text-4xl">.</span>
            </h1>
            <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">setup / complete</p>
          </div>

          {/* Completion Message */}
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-inter font-black tracking-tight text-white lowercase">you're all set</h2>
              <p className="text-sm font-mono tracking-tight text-zinc-400 lowercase leading-relaxed max-w-md mx-auto">
                blackbox is now calibrated to your creative profile. let's begin analyzing your artistic intelligence.
              </p>
            </div>

            {/* Action Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-12 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight uppercase"
                asChild
              >
                <Link href="/dashboard">ENTER BLACKBOX</Link>
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-8 bg-zinc-700 rounded-full" />
            <div className="h-1 w-8 bg-zinc-700 rounded-full" />
            <div className="h-1 w-8 bg-zinc-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
