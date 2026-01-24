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
import { User, CreditCard, FileText, ExternalLink, Receipt, Wallet, History, Clock } from "lucide-react"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

    // Fetch ALL payments scoped to this business
    const { data: allPayments } = await supabase
        .from('payments')
        .select(`
            *,
            users!payments_user_id_fkey(full_name, email),
            loans(id, amount, purpose, status)
        `)
        .eq('business_id', profile.business_id)
        .order('created_at', { ascending: false })

    const pendingPayments = allPayments?.filter(p => p.status === 'pending') || []
    const historyPayments = allPayments?.filter(p => p.status !== 'pending') || []

    const renderPaymentCards = (paymentsList: any[]) => {
        if (!paymentsList || paymentsList.length === 0) {
            return (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No payments found</p>
                    </CardContent>
                </Card>
            )
        }

        return paymentsList.map((payment: any) => {
            const isPending = payment.status === 'pending'
            return (
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
                                <Badge variant={isPending ? "outline" : "default"} className="text-xs capitalize">
                                    {payment.status}
                                </Badge>
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

                        {isPending && (
                            <div className="pt-2">
                                <PaymentReviewActions paymentId={payment.id} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )
        })
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Payment Reconciliation</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Review submissions and view transaction history
                </p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="pending" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Pending ({pendingPayments.length})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" />
                        History ({historyPayments.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-6">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {renderPaymentCards(pendingPayments)}
                    </div>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        {renderPaymentTable(pendingPayments)}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {renderPaymentCards(historyPayments)}
                    </div>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        {renderPaymentTable(historyPayments, true)}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function renderPaymentTable(paymentsList: any[], isHistory = false) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {isHistory ? "Payment History" : "Pending Reconciliation"}
                </CardTitle>
                <CardDescription>
                    {isHistory ? "Historical records of verified transactions" : "Transactions awaiting verification"}
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
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!paymentsList || paymentsList.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        )}
                        {paymentsList?.map((payment: any) => (
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
                                    <Badge variant={payment.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                                        {payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {payment.status === 'pending' ? (
                                        <PaymentReviewActions paymentId={payment.id} />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(payment.updated_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
