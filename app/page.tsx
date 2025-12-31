import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* 3D Void Vignette Effect */}
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
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[340px] space-y-8">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <h1 className="text-7xl font-inter font-black tracking-[-0.08em] text-white lowercase">
              blackbox<span className="text-5xl">.</span>
            </h1>
            <p className="text-[10px] lowercase tracking-tight font-mono text-zinc-500">artist intelligence</p>
          </div>

          {/* Login Form */}
          <form className="space-y-4">
            <Input
              type="email"
              placeholder="email"
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono tracking-tight lowercase"
            />

            <Input
              type="password"
              placeholder="password"
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 font-mono tracking-tight lowercase"
            />

            <Button
              type="submit"
              variant="outline"
              className="w-full h-11 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/30 hover:text-white hover:border-zinc-700 transition-colors font-inter font-black tracking-tight uppercase"
            >
              ENTER
            </Button>
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
  )
}
