import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Zap, Building2, User, ChevronRight, CheckCircle } from "lucide-react"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Animated grid background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" />

      {/* Radial glow blobs */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, oklch(0.80 0.18 210 / 0.35) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.20 275 / 0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl px-4 py-16 md:py-20 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-6 animate-slide-up">
          {/* Shield icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-pulse-glow" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-xl">
                <Shield className="h-10 w-10 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Brand name */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground tracking-widest uppercase">
              <div className="h-px w-8 bg-primary/50" />
              Secure · Compliant · Trusted
              <div className="h-px w-8 bg-primary/50" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="gradient-text-brand">Strata</span>
              <span className="text-foreground"> LMS</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Enterprise-grade loan management platform built for lenders who demand{" "}
              <span className="text-foreground font-medium">security, speed, and control</span>.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            {[
              { icon: Lock, label: "256-bit Encryption" },
              { icon: Shield, label: "Bank-grade Security" },
              { icon: CheckCircle, label: "KYC Compliant" },
              { icon: Zap, label: "Real-time Processing" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5">
                <Icon className="h-3 w-3 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {/* Customer Portal */}
          <div className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-all duration-300 group-hover:glow-teal-sm">
                  <User className="h-7 w-7 text-primary" strokeWidth={1.5} />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Customer Portal</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Access your loan applications, track repayment schedules, make payments, and manage your account securely.
                </p>
              </div>
              <div className="space-y-3">
                <Link href="/auth/customer/login" className="block">
                  <Button size="lg" className="w-full" variant="glow">
                    <Lock className="h-4 w-4" />
                    Sign In Securely
                  </Button>
                </Link>
                <Link href="/auth/customer/sign-up" className="block">
                  <Button size="lg" variant="outline" className="w-full">
                    Sign Up with Invite Code
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Business Portal */}
          <div className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-secondary/40 hover:shadow-2xl hover:shadow-secondary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/10 transition-all duration-300 group-hover:glow-indigo">
                  <Building2 className="h-7 w-7 text-secondary-foreground/80" strokeWidth={1.5} />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-secondary-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Business Portal</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage your lending operations, review KYC applications, approve loans, and track portfolio performance.
                </p>
              </div>
              <div className="space-y-3">
                <Link href="/auth/admin/login" className="block">
                  <Button size="lg" className="w-full bg-secondary hover:brightness-110 text-secondary-foreground shadow-md hover:shadow-lg hover:shadow-secondary/20">
                    <Lock className="h-4 w-4" />
                    Admin Sign In
                  </Button>
                </Link>
                <Link href="/auth/admin/sign-up" className="block">
                  <Button size="lg" variant="outline" className="w-full">
                    Register Business
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/60 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          Protected by industry-standard security protocols. All data is encrypted in transit and at rest.
        </p>
      </div>
    </main>
  )
}
