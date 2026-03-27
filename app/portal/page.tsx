import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { calculateOutstandingBalance } from "@/lib/domain/finance"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Banknote, Calendar, AlertCircle, FileText,
  ShieldCheck, ShieldAlert, Shield, ArrowRight,
  TrendingDown, CheckCircle, Clock
} from "lucide-react"

export default async function PortalDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Not authenticated</div>

  const { data: activeLoan, error: activeLoanError } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'approved', 'defaulted'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (activeLoanError && activeLoanError.code !== 'PGRST116') {
    console.error('Error fetching active loan:', activeLoanError)
  }

  const { data: kyc } = await supabase
    .from('kyc_records').select('status').eq('user_id', user.id).single()
  const kycStatus = kyc?.status || 'not_submitted'

  const { count: pendingLoans } = await supabase
    .from('loans').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['pending', 'submitted', 'under_review'])

  let currentBalance = 0
  let nextDueDate = null

  if (activeLoan) {
    const { data: payments } = await supabase
      .from('payments').select('amount').eq('loan_id', activeLoan.id).eq('status', 'approved')

    const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    currentBalance = calculateOutstandingBalance(activeLoan, payments)
    activeLoan.totalPaid = totalPaid

    const baseDate = activeLoan.due_date || activeLoan.disbursed_at || activeLoan.reviewed_at || activeLoan.approved_at || activeLoan.created_at
    if (baseDate) {
      const date = new Date(baseDate)
      if (!activeLoan.due_date) date.setMonth(date.getMonth() + 1)
      nextDueDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // KYC display helpers
  const kycConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary"; icon: typeof ShieldCheck }> = {
    approved:       { label: "Verified",       variant: "success",     icon: ShieldCheck },
    rejected:       { label: "Rejected",       variant: "destructive", icon: ShieldAlert },
    pending_review: { label: "Under Review",   variant: "warning",     icon: Clock       },
    submitted:      { label: "Submitted",      variant: "warning",     icon: Clock       },
    not_submitted:  { label: "Not Submitted",  variant: "secondary",   icon: Shield      },
  }
  const kycInfo = kycConfig[kycStatus] || kycConfig['not_submitted']
  const KycIcon = kycInfo.icon

  const totalPayable = activeLoan?.total_payable_amount || activeLoan?.amount || 0
  const progressPct = totalPayable > 0
    ? Math.min(100, Math.round(((activeLoan?.totalPaid || 0) / totalPayable) * 100))
    : 0

  return (
    <div className="space-y-6 pb-10 animate-slide-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your loans and account</p>
        </div>
        <Link href="/portal/loans/new" className="w-full sm:w-auto">
          <Button size="sm" variant="glow" className="gap-2 w-full sm:w-auto">
            <Banknote className="h-4 w-4" />
            Request a Loan
          </Button>
        </Link>
      </div>

      {/* KYC Status Banner */}
      {kycStatus !== 'approved' && (
        <Link href="/portal/kyc">
          <div className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all hover:brightness-105 ${
            kycStatus === 'rejected'
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-amber-500/30 bg-amber-500/5'
          }`}>
            <div className="flex items-center gap-3">
              <KycIcon className={`h-5 w-5 ${kycStatus === 'rejected' ? 'text-destructive' : 'text-amber-400'}`} />
              <div>
                <p className="text-sm font-semibold">
                  {kycStatus === 'not_submitted' ? 'Complete your identity verification' : `KYC Status: ${kycInfo.label}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {kycStatus === 'not_submitted'
                    ? 'Verification is required before you can apply for a loan'
                    : 'Click to check your verification status'}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Balance */}
        <Card className="kpi-bar-teal hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Balance
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Banknote className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-bold font-display">{formatCurrency(currentBalance)}</div>
            {activeLoan && (
              <p className="text-xs text-emerald-400 mt-1">
                Paid: {formatCurrency(activeLoan.totalPaid || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Next Due */}
        <Card className="kpi-bar-amber hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next Due Date
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Calendar className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-bold font-display">{nextDueDate || '—'}</div>
            {activeLoan && currentBalance > 0 && (
              <p className="text-xs text-amber-400 mt-1">Payment required</p>
            )}
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="kpi-bar-indigo hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Applications
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
              <FileText className="h-4 w-4 text-secondary-foreground/80" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-bold font-display">{pendingLoans || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Under review</p>
          </CardContent>
        </Card>

        {/* KYC */}
        <Link href="/portal/kyc">
          <Card className={`h-full cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${
            kycStatus === 'approved' ? 'kpi-bar-green' : kycStatus === 'rejected' ? 'kpi-bar-rose' : 'kpi-bar-amber'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ID Verification
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                kycStatus === 'approved' ? 'bg-emerald-500/10' : kycStatus === 'rejected' ? 'bg-destructive/10' : 'bg-amber-500/10'
              }`}>
                <KycIcon className={`h-4 w-4 ${
                  kycStatus === 'approved' ? 'text-emerald-400' : kycStatus === 'rejected' ? 'text-destructive' : 'text-amber-400'
                }`} />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Badge variant={kycInfo.variant as any} className="text-xs mb-1">
                {kycInfo.label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {kycStatus === 'approved' ? 'View profile →' : 'Check status →'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Active Loan Card */}
      <Card>
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" strokeWidth={1.5} />
              Active Loan
            </CardTitle>
            {activeLoan && (
              <Badge variant="success" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {activeLoan.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {activeLoan ? (
            <div className="space-y-6">
              {/* Progress bar */}
              {totalPayable > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Repayment Progress</span>
                    <span className="font-medium text-foreground">{progressPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Metrics grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Principal", value: formatCurrency(activeLoan.principal_amount || activeLoan.amount), color: "" },
                  { label: "Total Payable", value: formatCurrency(activeLoan.total_payable_amount || activeLoan.amount), color: "" },
                  { label: "Total Paid", value: formatCurrency(activeLoan.totalPaid || 0), color: "text-emerald-400" },
                  { label: "Remaining", value: formatCurrency(currentBalance), color: "text-destructive" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link href="/portal/loans">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    View Details
                  </Button>
                </Link>
                {currentBalance > 0 && (
                  <Link href="/portal/payments">
                    <Button size="sm" variant="glow" className="gap-2">
                      <Banknote className="h-4 w-4" />
                      Make Payment
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-card mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">No active loans found.</p>
              <Link href="/portal/loans/new">
                <Button variant="outline-glow" size="sm" className="gap-2">
                  <Banknote className="h-4 w-4" />
                  Apply for a Loan
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
