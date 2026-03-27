import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Banknote, BarChart3, TrendingUp, Shield, Clock, AlertCircle, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { calculateOutstandingBalance } from "@/lib/domain/finance"
import { LOAN_STATUS, KYC_STATUS } from "@/lib/constants"
import { getAppOrigin } from "@/lib/config/app"
import { InviteCard } from "@/components/admin/invite-card"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Not authenticated</div>

  const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
  const { data: business } = await supabase.from('businesses').select('id, name, code').eq('id', profile?.business_id).single()
  const inviteLink = `${getAppOrigin()}/auth/customer/sign-up?code=${business?.code}`
  if (!business) return <div className="p-8 text-center text-muted-foreground">Business configuration not found.</div>

  const { count: pendingLoans } = await supabase
    .from('loans').select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .in('status', [LOAN_STATUS.PENDING, LOAN_STATUS.SUBMITTED, LOAN_STATUS.UNDER_REVIEW])

  const { count: pendingKyc } = await supabase
    .from('kyc_records').select('id', { count: 'exact', head: true })
    .in('status', [KYC_STATUS.PENDING_REVIEW, KYC_STATUS.SUBMITTED])
    .eq('business_id', business.id)

  const { count: verifiedCustomers } = await supabase
    .from('kyc_records').select('id', { count: 'exact', head: true })
    .eq('status', KYC_STATUS.APPROVED).eq('business_id', business.id)

  const { count: pendingPayments } = await supabase
    .from('payments').select('*', { count: 'exact', head: true })
    .eq('business_id', business.id).eq('status', 'pending')

  const { data: disbursedLoans } = await supabase
    .from('loans').select('amount')
    .eq('business_id', business.id)
    .in('status', ['active', 'closed', 'defaulted', 'approved'])

  const totalDisbursed = disbursedLoans?.reduce((sum, loan) => sum + Number(loan.amount), 0) || 0

  const { data: activePortfolio } = await supabase
    .from('loans').select('id, amount, total_payable_amount, payments(amount, status)')
    .eq('business_id', business.id).in('status', ['active', 'defaulted', 'approved'])

  const totalOutstanding = activePortfolio?.reduce((sum, loan) => {
    const approvedPayments = (loan.payments as any[])?.filter(p => p.status === 'approved') || []
    return sum + calculateOutstandingBalance(loan, approvedPayments)
  }, 0) || 0

  const kpiCards = [
    {
      title: "Total Disbursed",
      value: formatCurrency(totalDisbursed),
      sub: "View detailed reports →",
      icon: TrendingUp,
      href: "/admin/reports",
      barClass: "kpi-bar-green",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Pending KYC",
      value: String(pendingKyc || 0),
      sub: (pendingKyc ?? 0) > 0 ? "Review applications →" : "No pending reviews",
      icon: Shield,
      href: "/admin/kyc",
      barClass: "kpi-bar-amber",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "Pending Loans",
      value: String(pendingLoans || 0),
      sub: (pendingLoans ?? 0) > 0 ? "Review applications →" : "All clear",
      icon: Clock,
      href: "/admin/loans",
      barClass: "kpi-bar-amber",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(totalOutstanding),
      sub: "Active portfolio balance",
      icon: AlertCircle,
      href: "/admin/reports",
      barClass: "kpi-bar-rose",
      iconBg: "bg-rose-500/10 text-rose-400",
    },
    {
      title: "Pending Payments",
      value: String(pendingPayments || 0),
      sub: (pendingPayments ?? 0) > 0 ? "Reconcile payments →" : "All cleared",
      icon: Banknote,
      href: "/admin/payments",
      barClass: "kpi-bar-teal",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Verified Customers",
      value: String(verifiedCustomers || 0),
      sub: "Ready for disbursement",
      icon: ShieldCheck,
      href: "/admin/kyc",
      barClass: "kpi-bar-indigo",
      iconBg: "bg-secondary/10 text-secondary-foreground/80",
    },
  ]

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor your lending operations</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi) => (
          <Link key={kpi.title} href={kpi.href} className="block group">
            <Card className={`relative overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:border-border/80 hover:-translate-y-0.5 cursor-pointer ${kpi.barClass}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-2xl font-bold font-display">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Invite Card */}
        <div className="col-span-full lg:col-span-4">
          <InviteCard inviteLink={inviteLink} businessCode={business?.code || ''} />
        </div>

        {/* Quick Actions */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader className="pb-3 px-6 pt-6">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pb-6 px-6">
            {[
              { href: "/admin/products", icon: Plus, label: "New Product" },
              { href: "/admin/loans", icon: FileText, label: "Review Loans" },
              { href: "/admin/payments", icon: Banknote, label: "Record Pay" },
              { href: "/admin/reports", icon: BarChart3, label: "View Reports" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className="w-full">
                <Button
                  variant="outline"
                  className="h-20 w-full flex-col gap-2 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                >
                  <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">{label}</span>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
