import { PaymentForm } from "@/components/payment-form"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { CreditCard, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// Helper to fetch balance from ledger
async function getLoanBalance(supabase: any, loanId: string): Promise<number> {
    const { data } = await supabase
        .from('ledger')
        .select('balance_after')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return data?.balance_after || 0
}

export default async function NewPaymentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/customer/login')

    // Fetch active loans
    const { data: loans } = await supabase
        .from('loans')
        .select('id, amount, purpose, status, duration_months')
        .eq('user_id', user.id)
        .in('status', ['active', 'defaulted'])

    // Get Business Config
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: business } = await supabase.from('businesses').select('payment_config').eq('id', profile?.business_id).single()

    const paymentConfig = business?.payment_config || {}

    // Fetch balances for each loan
    const loansWithBalance = await Promise.all(
        (loans || []).map(async (loan: any) => {
            const balance = await getLoanBalance(supabase, loan.id)
            return { ...loan, balance }
        })
    )

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    Make a Payment
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Submit payment for your active loan
                </p>
            </div>

            {/* Payment Form */}
            {loansWithBalance && loansWithBalance.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                        <CardDescription>
                            Select your loan and provide payment information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PaymentForm
                            userId={user.id}
                            businessId={profile?.business_id}
                            loans={loansWithBalance}
                            paymentConfig={paymentConfig}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-2">No active loans found</p>
                        <p className="text-sm text-muted-foreground">
                            You need an active loan to make a payment
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
