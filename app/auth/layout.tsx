import type { Metadata } from 'next'
import { Shield, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Authentication — Strata LMS',
  description: 'Secure login to Strata Loan Management System',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-50" />

      {/* Left decorative panel — hidden on mobile */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Glow blobs */}
        <div
          className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.80 0.18 210 / 0.18) 0%, transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-10 left-10 h-[300px] w-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.20 275 / 0.12) 0%, transparent 65%)" }}
        />

        <div className="relative z-10 text-center space-y-8 max-w-md">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl animate-pulse-glow" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                <Shield className="h-12 w-12 text-primary" strokeWidth={1.3} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold">
              <span className="gradient-text-brand">Strata LMS</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Enterprise loan management with bank-grade security protocols protecting every transaction.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 text-left">
            {[
              "256-bit end-to-end encryption",
              "Real-time KYC verification",
              "Automated compliance checks",
              "Multi-factor authentication ready",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Lock className="h-2.5 w-2.5 text-primary" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 lg:border-l lg:border-border/50">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile-only brand */}
          <div className="flex flex-col items-center space-y-2 text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
              <Shield className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold gradient-text-brand">Strata LMS</h1>
          </div>

          {/* Secure badge */}
          <div className="flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3 text-primary" />
              Secured by Strata — All data encrypted
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
