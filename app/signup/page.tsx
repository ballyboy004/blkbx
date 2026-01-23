"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SignupForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const rt = searchParams.get("redirectTo");
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.session) {
      setMessage("account created. check your email to confirm, then log in.");
      return;
    }

    window.location.assign(redirectTo);
  }

  return (
    <>
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

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-mono tracking-tight lowercase"
        >
          back to login
        </Link>
      </div>
    </>
  );
}

function SignupFormSkeleton() {
  return (
    <>
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <h1 className="text-7xl font-inter font-black tracking-[-0.08em] text-white lowercase">
          blackbox<span className="text-5xl">.</span>
        </h1>
        <p className="text-[12px] lowercase tracking-tight font-mono text-zinc-500">
          creative intelligence
        </p>
      </div>

      {/* Skeleton Form */}
      <div className="space-y-4">
        <div className="h-11 bg-zinc-900/50 border border-zinc-800 rounded-md" />
        <div className="h-11 bg-zinc-900/50 border border-zinc-800 rounded-md" />
        <div className="h-11 bg-zinc-900/30 border border-zinc-800 rounded-md" />
      </div>

      {/* Link placeholder */}
      <div className="text-center">
        <span className="text-xs text-zinc-600 font-mono tracking-tight lowercase">
          back to login
        </span>
      </div>
    </>
  );
}

export default function SignupPage() {
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
          <Suspense fallback={<SignupFormSkeleton />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
