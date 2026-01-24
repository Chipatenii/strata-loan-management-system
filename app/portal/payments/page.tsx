import { PaymentForm } from "@/components/payment-form"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { CreditCard, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { calculateOutstandingBalance } from "@/lib/domain/finance"

async function getLoanFinancials(supabase: any, loanId: string): Promise<{ balance: number, totalPaid: number }> {
    const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('loan_id', loanId)
        .eq('status', 'approved')

    const totalPaid = payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0

    // We need to fetch the loan to get totals if the provided list lacks it, 
    // but here we already have it in the map below.
    return { balance: 0, totalPaid } // Balance calculated in map to avoid double loan fetch
}

export default async function NewPaymentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/customer/login')

    // Fetch active loans
    const { data: loans } = await supabase
        .from('loans')
        .select('id, amount, total_payable_amount, purpose, status, duration_months')
        .eq('user_id', user.id)
        .in('status', ['active', 'approved', 'defaulted'])

    // Get Business Config
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: business } = await supabase.from('businesses').select('payment_config').eq('id', profile?.business_id).single()

    const paymentConfig = business?.payment_config || {}
    const paymentInstructions = paymentConfig.general_instructions || ""

    // Fetch balances for each loan
    const loansWithBalance = await Promise.all(
        (loans || []).map(async (loan: any) => {
            const { totalPaid } = await getLoanFinancials(supabase, loan.id)
            // Use calculateOutstandingBalance instead of ledger for consistency
            const { data: payments } = await supabase.from('payments').select('amount').eq('loan_id', loan.id).eq('status', 'approved')
            const balance = calculateOutstandingBalance(loan, payments)
            return { ...loan, balance, totalPaid }
        })
    )

    return (
        <div className="space-y-6 px-4 md:px-0 pb-10">
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
                            instructionText={paymentInstructions}
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
