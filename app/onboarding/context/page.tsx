"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function OnboardingContextPage() {
  const [context, setContext] = useState("")

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* 3D Void Vignette Effect - matching login page */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Layered radial gradients for depth */}
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
            <p className="text-xs lowercase tracking-tight font-mono text-zinc-500">setup / context</p>
          </div>

          {/* Onboarding Form */}
          <div className="space-y-8">
            {/* Instructions */}
            <div className="space-y-3">
              <h2 className="text-2xl font-inter font-black tracking-tight text-white lowercase">
                tell us about yourself
              </h2>
              <p className="text-sm font-mono tracking-tight text-zinc-400 lowercase leading-relaxed">
                provide context about your work, style, and goals. this helps blackbox understand your creative
                direction.
              </p>
            </div>

            {/* Context Input */}
            <div className="space-y-4">
              <Textarea
                placeholder="i'm a visual artist focused on..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[200px] bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono text-sm tracking-tight lowercase resize-none"
              />
              <p className="text-xs font-mono tracking-tight text-zinc-600 lowercase">{context.length} characters</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight uppercase"
              >
                CONTINUE
              </Button>
              <Button
                type="button"
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
            <div className="h-1 w-8 bg-zinc-800 rounded-full" />
            <div className="h-1 w-8 bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
