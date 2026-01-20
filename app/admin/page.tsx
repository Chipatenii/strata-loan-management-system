import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Banknote, BarChart3 } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { LOAN_STATUS, KYC_STATUS } from "@/lib/constants"
import { getAppOrigin } from "@/lib/config/app"
import { InviteCard } from "@/components/admin/invite-card"

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch Business Code
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: business } = await supabase.from('businesses').select('*').eq('id', profile?.business_id).single()

    // Use centralized app origin
    const inviteLink = `${getAppOrigin()}/auth/customer/sign-up?code=${business?.code}`

    // Real Metrics using Supabase counts/sums
    // 1. Pending Loans
    const { count: pendingLoans } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .in('status', [LOAN_STATUS.PENDING, LOAN_STATUS.SUBMITTED, LOAN_STATUS.UNDER_REVIEW])

    // 2. Pending KYC
    // We need to filter KYC by users belonging to this business. 
    // This requires a join or two-step. 
    // Join: kyc_records -> users -> business_id
    const { count: pendingKyc } = await supabase
        .from('kyc_records')
        .select('*, users!inner(business_id)', { count: 'exact', head: true })
        .eq('status', KYC_STATUS.PENDING_REVIEW)
        .eq('users.business_id', business.id)

    // 3. Total Disbursed (Active + Closed + Defaulted)
    const { data: disbursedLoans } = await supabase
        .from('loans')
        .select('amount')
        .eq('business_id', business.id)
        .in('status', ['active', 'closed', 'defaulted'])

    const totalDisbursed = disbursedLoans?.reduce((sum, loan) => sum + Number(loan.amount), 0) || 0

    // 4. Outstanding (Active + Defaulted) - Principal only for dashboard speed
    const { data: activeLoans } = await supabase
        .from('loans')
        .select('amount')
        .eq('business_id', business.id)
        .in('status', ['active', 'defaulted'])

    const totalOutstanding = activeLoans?.reduce((sum, loan) => sum + Number(loan.amount), 0) || 0

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Disbursed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalDisbursed)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending KYC
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingKyc || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Loans
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingLoans || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Outstanding Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Use new InviteCard component */}
                <InviteCard inviteLink={inviteLink} businessCode={business?.code || ''} />

                <Card className="col-span-full md:col-span-2 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Link href="/admin/products" className="w-full">
                            <Button variant="outline" className="h-24 w-full flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                                <Plus className="h-6 w-6" />
                                <span className="text-xs font-semibold">New Product</span>
                            </Button>
                        </Link>
                        <Link href="/admin/loans" className="w-full">
                            <Button variant="outline" className="h-24 w-full flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                                <FileText className="h-6 w-6" />
                                <span className="text-xs font-semibold">Review Loans</span>
                            </Button>
                        </Link>
                        <Link href="/admin/payments" className="w-full">
                            <Button variant="outline" className="h-24 w-full flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                                <Banknote className="h-6 w-6" />
                                <span className="text-xs font-semibold">Record Pay</span>
                            </Button>
                        </Link>
                        <Link href="/admin/reports" className="w-full">
                            <Button variant="outline" className="h-24 w-full flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                                <BarChart3 className="h-6 w-6" />
                                <span className="text-xs font-semibold">View Reports</span>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
