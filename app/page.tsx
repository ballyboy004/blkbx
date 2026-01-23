"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // middleware sends you here as: /?redirectTo=%2Fonboarding (or %2Fdashboard)
  const redirectTo = useMemo(() => {
    const rt = searchParams.get("redirectTo");
    if (!rt) return "/dashboard";
    if (!rt.startsWith("/")) return "/dashboard";
    if (rt.startsWith("/auth")) return "/dashboard";
    return rt;
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setMessage(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    // If confirmations are on, session can be null.
    if (!data.session) {
      setMessage("check your email to confirm your account, then log in.");
      return;
    }

    // ✅ Hard nav so the next request goes through middleware with fresh auth state
    window.location.assign(redirectTo);
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

          {/* Login Form */}
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
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="outline"
              disabled={loading}
              className="w-full h-11 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight lowercase disabled:opacity-60"
            >
              {loading ? "entering…" : "enter."}
            </Button>

            {message && (
              <p className="text-xs font-mono tracking-tight text-zinc-500 lowercase">
                {message}
              </p>
            )}
          </form>

          {/* Create Account Link */}
          <div className="text-center">
            <Link
              href="/signup"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-mono tracking-tight lowercase"
            >
              create account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}