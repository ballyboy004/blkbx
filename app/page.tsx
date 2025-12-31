"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState<"signin" | "signup" | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setLoading("signin")

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(null)

    if (error) {
      setMessage(error.message)
      return
    }

    // hard redirect helps session/middleware sync immediately
    window.location.href = "/onboarding/context"
  }

  async function onSignUp(e: React.MouseEvent) {
    e.preventDefault()
    setMessage(null)
    setLoading("signup")

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding/context`,
      },
    })

    setLoading(null)

    if (error) {
      setMessage(error.message)
      return
    }

    // If confirm email is ON in Supabase, session will often be null until they confirm.
    if (!data.session) {
      setMessage("account created. check your email to confirm, then log in.")
      return
    }

    window.location.href = "/onboarding/context"
  }

  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* 3D Void Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Layered radial gradients for depth */}
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
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[340px] space-y-8">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <h1 className="text-7xl font-inter font-black tracking-[-0.08em] text-white lowercase">
              blackbox<span className="text-5xl">.</span>
            </h1>
            <p className="text-[12px] lowercase tracking-tight font-mono text-zinc-500">
              creative intelligence
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={onSignIn}>
            <Input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono tracking-tight lowercase"
              required
              autoComplete="email"
            />

            <Input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono tracking-tight lowercase"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="outline"
              disabled={loading !== null}
              className="w-full h-11 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight lowercase"
            >
              {loading === "signin" ? "entering." : "enter."}
            </Button>

            {message ? (
              <p className="text-xs text-zinc-600 font-mono tracking-tight lowercase text-center">
                {message}
              </p>
            ) : null}
          </form>

          {/* Create Account Link */}
          <div className="text-center">
            {/* visually identical: still a Link component + same classes */}
            <Link
              href="/signup"
              onClick={onSignUp}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-mono tracking-tight lowercase"
            >
              {loading === "signup" ? "creating account..." : "create account"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}