// app/signup/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  console.log('[Signup] Component loading...');
  
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If they came from middleware, it might be: /signup?redirectTo=%2Fonboarding
  // Default: onboarding (new users should go onboarding first)
  const redirectTo = useMemo(() => {
    const rt = searchParams.get("redirectTo");
    console.log('[Signup] Calculating redirectTo:', { rt, searchParams: searchParams.toString() });
    
    if (!rt) return "/onboarding";
    if (!rt.startsWith("/")) return "/onboarding";
    if (rt.startsWith("/auth")) return "/onboarding";
    return rt;
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setMessage(null);
    setLoading(true);

    console.log('[Signup] Attempting signup for:', email);

    // Clear any existing session first to avoid conflicts (silently)
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      // Ignore - no session to clear
    }

    // IMPORTANT:
    // - If email confirmations are ON, Supabase will send an email and session may be null.
    // - emailRedirectTo should point to your existing callback route.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    console.log('[Signup] Response:', { 
      hasUser: !!data.user, 
      hasSession: !!data.session, 
      error: error?.message,
      userEmail: data.user?.email
    });

    if (error) {
      console.log('[Signup] Error occurred:', error.message);
      setMessage(error.message);
      return;
    }

    // If confirmations are OFF, you may get a session immediately.
    // If confirmations are ON, session is typically null and user must confirm email.
    if (!data.session) {
      console.log('[Signup] No session - email confirmation required');
      setMessage("account created. check your email to confirm, then log in.");
      return;
    }

    // Hard nav so middleware sees auth cookies.
    console.log('[Signup] Session created, redirecting to:', redirectTo);
    window.location.assign(redirectTo);
  }

  // Debug function to manually clear session
  async function clearSession() {
    console.log('[Signup] Manually clearing session...');
    await supabase.auth.signOut();
    setMessage('session cleared. try again.');
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* 3D Void Vignette Effect */}
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

          {/* Signup Form */}
          <form className="space-y-4" onSubmit={onSubmit}>
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
              minLength={6}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="outline"
              disabled={loading}
              className="w-full h-11 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight lowercase disabled:opacity-60"
            >
              {loading ? "creating…" : "create."}
            </Button>

            {message && (
              <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">
                {message}
              </p>
            )}
          </form>

          {/* Back to Login + Debug */}
          <div className="text-center space-y-3">
            <Link
              href="/"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-mono tracking-tight lowercase"
            >
              back to login
            </Link>
            
            {/* Debug button - remove in production */}
            <button
              onClick={clearSession}
              className="block mx-auto text-[10px] text-zinc-700 hover:text-zinc-500 font-mono tracking-tight lowercase"
            >
              clear session (debug)
            </button>
          </div>

          {/* tiny debug line */}
          <p className="text-[10px] text-center font-mono text-zinc-700 lowercase">
            redirecting to: {redirectTo}
          </p>
        </div>
      </div>
    </div>
  );
}