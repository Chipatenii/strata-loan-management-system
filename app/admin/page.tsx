import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

    // Fetch Business Code
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: business } = await supabase.from('businesses').select('id, name, code').eq('id', profile?.business_id).single()

    // Use centralized app origin
    const inviteLink = `${getAppOrigin()}/auth/customer/sign-up?code=${business?.code}`

    if (!business) return <div className="p-8 text-center text-muted-foreground">Business configuration not found.</div>

    // Real Metrics using Supabase counts/sums
    // 1. Pending Loans
    const { count: pendingLoans } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .in('status', [LOAN_STATUS.PENDING, LOAN_STATUS.SUBMITTED, LOAN_STATUS.UNDER_REVIEW])

    // 2. Pending KYC (Filter by business_id directly for robustness)
    const { count: pendingKyc } = await supabase
        .from('kyc_records')
        .select('id', { count: 'exact', head: true })
        .in('status', [KYC_STATUS.PENDING_REVIEW, KYC_STATUS.SUBMITTED])
        .eq('business_id', business.id)

    // 2b. Verified Customers (Approved KYC)
    const { count: verifiedCustomers } = await supabase
        .from('kyc_records')
        .select('id', { count: 'exact', head: true })
        .eq('status', KYC_STATUS.APPROVED)
        .eq('business_id', business.id)

    // 3. Pending Payments
    const { count: pendingPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('status', 'pending')

    // 4. Total Disbursed (Active + Closed + Defaulted + Approved)
    const { data: disbursedLoans } = await supabase
        .from('loans')
        .select('amount')
        .eq('business_id', business.id)
        .in('status', ['active', 'closed', 'defaulted', 'approved'])

    const totalDisbursed = disbursedLoans?.reduce((sum, loan) => sum + Number(loan.amount), 0) || 0

    // 4. Outstanding Portfolio Value (Active + Defaulted + Approved)
    const { data: activePortfolio } = await supabase
        .from('loans')
        .select('id, amount, total_payable_amount, payments(amount, status)')
        .eq('business_id', business.id)
        .in('status', ['active', 'defaulted', 'approved'])

    const totalOutstanding = activePortfolio?.reduce((sum, loan) => {
        // Only count approved payments
        const approvedPayments = (loan.payments as any[])?.filter(p => p.status === 'approved') || []
        return sum + calculateOutstandingBalance(loan, approvedPayments)
    }, 0) || 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
            </div>

            {/* KPI Cards Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Disbursed */}
                <Link href="/admin/reports" className="block">
                    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Disbursed
                            </CardTitle>
                            <div className="rounded-full bg-green-500/10 p-2 group-hover:bg-green-500/20 transition-colors">
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">{formatCurrency(totalDisbursed)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                View detailed reports →
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Pending KYC */}
                <Link href="/admin/kyc" className="block">
                    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending KYC
                            </CardTitle>
                            <div className="rounded-full bg-amber-500/10 p-2 group-hover:bg-amber-500/20 transition-colors">
                                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">{pendingKyc || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {(pendingKyc ?? 0) > 0 ? 'Review applications →' : 'No pending reviews'}
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Pending Loans */}
                <Link href="/admin/loans" className="block">
                    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Loans
                            </CardTitle>
                            <div className="rounded-full bg-amber-500/10 p-2 group-hover:bg-amber-500/20 transition-colors">
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">{pendingLoans || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {(pendingLoans ?? 0) > 0 ? 'Review applications →' : 'No pending reviews'}
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Outstanding Balance */}
                <Link href="/admin/reports" className="block">
                    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Outstanding Balance
                            </CardTitle>
                            <div className="rounded-full bg-red-500/10 p-2 group-hover:bg-red-500/20 transition-colors">
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Active portfolio balance
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Pending Payments Card */}
                <Link href="/admin/payments" className="block">
                    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Payments
                            </CardTitle>
                            <div className="rounded-full bg-green-500/10 p-2 group-hover:bg-green-500/20 transition-colors">
                                <Banknote className="h-4 w-4 text-green-600 dark:text-green-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">{pendingPayments || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {(pendingPayments ?? 0) > 0 ? 'Reconcile payments →' : 'All cleared'}
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Verified Customers Card */}
                <Link href="/admin/kyc" className="block">
                    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Verified Customers
                            </CardTitle>
                            <div className="rounded-full bg-blue-500/10 p-2 group-hover:bg-blue-500/20 transition-colors">
                                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">{verifiedCustomers || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Customers ready for disbursement
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Invite Card and Quick Actions */}
                <div className="col-span-full lg:col-span-4">
                    <InviteCard inviteLink={inviteLink} businessCode={business?.code || ''} />
                </div>

                <Card className="col-span-full lg:col-span-3">
                    <CardHeader className="pb-3 px-6 pt-6">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 pb-6 px-6">
                        <Link href="/admin/products" className="w-full">
                            <Button variant="outline" className="h-20 w-full flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                                <Plus className="h-5 w-5" />
                                <span className="text-[10px] uppercase tracking-wider font-bold">New Product</span>
                            </Button>
                        </Link>
                        <Link href="/admin/loans" className="w-full">
                            <Button variant="outline" className="h-20 w-full flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                                <FileText className="h-5 w-5" />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Review Loans</span>
                            </Button>
                        </Link>
                        <Link href="/admin/payments" className="w-full">
                            <Button variant="outline" className="h-20 w-full flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                                <Banknote className="h-5 w-5" />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Record Pay</span>
                            </Button>
                        </Link>
                        <Link href="/admin/reports" className="w-full">
                            <Button variant="outline" className="h-20 w-full flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                                <BarChart3 className="h-5 w-5" />
                                <span className="text-[10px] uppercase tracking-wider font-bold">View Reports</span>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
