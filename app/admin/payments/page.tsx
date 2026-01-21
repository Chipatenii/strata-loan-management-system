import { createClient } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaymentReviewActions } from "@/components/admin/payment-actions"
import { formatCurrency } from "@/lib/utils"
import { User, CreditCard, FileText, ExternalLink, Receipt, Wallet } from "lucide-react"
import { redirect } from "next/navigation"

export default async function PaymentQueuePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/admin/login')

    // Get business_id for scoping
    const { data: profile } = await supabase
        .from('users')
        .select('business_id')
        .eq('id', user.id)
        .single()

    if (!profile?.business_id) {
        return <div className="text-center py-12 text-muted-foreground">No business configured.</div>
    }

    // Fetch payments WITH business_id scope AND loan info
    const { data: payments } = await supabase
        .from('payments')
        .select(`
            *,
            users(full_name, email),
            loans(id, amount, purpose, status)
        `)
        .eq('business_id', profile.business_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    const renderPaymentCards = () => {
        if (!payments || payments.length === 0) {
            return (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No pending payments</p>
                        <p className="text-sm mt-1">All payments have been reconciled</p>
                    </CardContent>
                </Card>
            )
        }

        return payments.map((payment: any) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-semibold truncate">{payment.users?.full_name || 'Unknown'}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{payment.users?.email}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                            <p className="text-xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    {/* Loan Context */}
                    {payment.loans && (
                        <div className="bg-muted/50 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Loan Context</span>
                            </div>
                            <p className="text-sm font-medium">
                                Loan #{payment.loans.id.slice(0, 8)} • {formatCurrency(payment.loans.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">{payment.loans.purpose || 'No purpose specified'}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Method</span>
                            </div>
                            <p className="text-sm font-medium capitalize">{payment.method?.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">{payment.provider || '-'}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Reference</span>
                            </div>
                            <p className="text-sm font-mono truncate">{payment.reference_code || 'N/A'}</p>
                        </div>
                    </div>

                    {payment.proof_url && (
                        <div className="pt-2 border-t">
                            <a
                                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${payment.proof_url}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                <FileText className="h-3 w-3" />
                                View Proof <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    )}

                    <div className="pt-2">
                        <PaymentReviewActions paymentId={payment.id} />
                    </div>
                </CardContent>
            </Card>
        ))
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Payment Reconciliation</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Review and approve customer payment submissions
                </p>
            </div>

            {/* Pending Count Badge */}
            {payments && payments.length > 0 && (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                        {payments.length} pending
                    </Badge>
                </div>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {renderPaymentCards()}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Pending Payments Queue</CardTitle>
                        <CardDescription>
                            Payments awaiting verification and ledger reconciliation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Loan</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Proof</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(!payments || payments.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No pending payments to reconcile.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {payments?.map((payment: any) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <div className="font-medium">{payment.users?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">{payment.users?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">#{payment.loans?.id?.slice(0, 8) || 'N/A'}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {payment.loans ? formatCurrency(payment.loans.amount) : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-green-600">{formatCurrency(payment.amount)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="capitalize">{payment.method?.replace('_', ' ')}</span>
                                                <span className="text-xs text-muted-foreground">{payment.provider}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {payment.reference_code || 'N/A'}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            {payment.proof_url ? (
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${payment.proof_url}`}
                                                    target="_blank"
                                                    className="text-xs underline text-primary hover:text-primary/80"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <PaymentReviewActions paymentId={payment.id} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
