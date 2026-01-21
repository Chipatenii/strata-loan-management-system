import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Banknote, Calendar, AlertCircle, TrendingUp, FileText } from "lucide-react"

export default async function PortalDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch user's active loan
    const { data: activeLoan } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'approved', 'disbursed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    // Fetch pending loan applications
    const { count: pendingLoans } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'submitted', 'under_review'])

    // Calculate current balance (total payable - payments made)
    let currentBalance = 0
    let nextDueDate = null

    if (activeLoan) {
        const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('loan_id', activeLoan.id)
            .eq('status', 'approved')

        const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
        currentBalance = Number(activeLoan.total_payable_amount || activeLoan.amount) - totalPaid

        // Calculate next due date (simplified - should use ledger)
        if (activeLoan.disbursed_at) {
            const disbursedDate = new Date(activeLoan.disbursed_at)
            disbursedDate.setMonth(disbursedDate.getMonth() + 1)
            nextDueDate = disbursedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <Link href="/portal/loans/new">
                    <Button size="sm" className="gap-2">
                        <Banknote className="h-4 w-4" />
                        Request Loan
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Current Balance
                        </CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(currentBalance)}
                        </div>
                        {activeLoan && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {activeLoan.duration_months} month loan
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Next Due Date
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {nextDueDate || '--'}
                        </div>
                        {activeLoan && currentBalance > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Payment required
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Applications
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingLoans || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Under review
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Loan Status
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {activeLoan ? (
                            <>
                                <div className="text-2xl font-bold capitalize">
                                    {activeLoan.status}
                                </div>
                                <Badge variant="default" className="mt-2 bg-green-600">
                                    Active
                                </Badge>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">--</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    No active loan
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Active Loan Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        Active Loan Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activeLoan ? (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Principal Amount</p>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(activeLoan.principal_amount || activeLoan.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Payable</p>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(activeLoan.total_payable_amount || activeLoan.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                                    <p className="text-lg font-semibold text-destructive">
                                        {formatCurrency(currentBalance)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Link href="/portal/loans">
                                    <Button variant="outline" size="sm">View Details</Button>
                                </Link>
                                {currentBalance > 0 && (
                                    <Link href="/portal/payments">
                                        <Button size="sm" className="gap-2">
                                            <Banknote className="h-4 w-4" />
                                            Make Payment
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/50 rounded-lg border-dashed border-2">
                            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground mb-4">No active loans found.</p>
                            <Link href="/portal/loans/new">
                                <Button variant="outline" className="gap-2">
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
