import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { calculateOutstandingBalance } from "@/lib/domain/finance"
import { StatusBadge } from "@/components/ui/status-badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function LoansListPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    const { data: loans } = await supabase
        .from('loans')
        .select(`
            *,
            payments(amount, status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const loansWithStats = loans?.map(loan => {
        const approvedPayments = (loan.payments as any[])?.filter(p => p.status === 'approved') || []
        const totalPaid = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        const balance = calculateOutstandingBalance(loan, approvedPayments)
        return { ...loan, totalPaid, balance }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">My Loans</h1>
                <Link href="/portal/loans/new">
                    <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Request Loan
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {loansWithStats?.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            You have no loan history.
                        </CardContent>
                    </Card>
                )}
                {loansWithStats?.map((loan: any) => (
                    <Card key={loan.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">
                                Loan #{loan.id.slice(0, 8)}
                            </CardTitle>
                            <StatusBadge status={loan.status} />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-2xl font-bold">{formatCurrency(loan.amount)}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {loan.duration_months} Months • {loan.purpose}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-muted-foreground">Remaining Balance</p>
                                    <p className={`text-lg font-bold ${loan.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                        {formatCurrency(loan.balance)}
                                    </p>
                                    <p className="text-[10px] text-green-600 font-medium">
                                        Total Paid: {formatCurrency(loan.totalPaid)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
