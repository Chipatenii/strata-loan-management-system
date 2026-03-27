import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { PortalNav } from "@/components/portal/portal-nav"
import { PortalMobileHeader } from "@/components/portal/mobile-header"
import { Shield } from "lucide-react"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/customer/login')

  // Get user's display name for the sidebar
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Customer'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <PortalMobileHeader displayName={displayName} />

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col md:flex fixed inset-y-0 left-0 z-20 glass-sidebar">
        {/* Brand header */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/12">
            <Shield className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-none">Strata LMS</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide uppercase">Customer Portal</p>
          </div>
        </div>

        {/* User avatar */}
        <div className="border-b border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/20">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">Borrower Account</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <PortalNav />
        </div>

        {/* Bottom security badge */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground tracking-wide">Secure Session Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 transition-all min-h-screen">
        <div className="h-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
