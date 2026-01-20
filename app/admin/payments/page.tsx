import { createClient } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaymentReviewActions } from "@/components/admin/payment-actions"
import { formatCurrency } from "@/lib/utils"
import { User, Banknote, CreditCard, FileText, ExternalLink, Receipt } from "lucide-react"

export default async function PaymentQueuePage() {
    const supabase = await createClient()

    const { data: payments } = await supabase
        .from('payments')
        .select('*, users(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    const renderPaymentCards = () => {
        if (!payments || payments.length === 0) {
            return (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No pending payments.</p>
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
                        <div className="flex-shrink-0">
                            <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
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
            <h1 className="text-2xl font-bold tracking-tight">Payment Reconciliation</h1>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {renderPaymentCards()}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Proof</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No pending payments.
                                </TableCell>
                            </TableRow>
                        )}
                        {payments?.map((payment: any) => (
                            <TableRow key={payment.id}>
                                <TableCell>
                                    <div className="font-medium">{payment.users?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">{payment.users?.email}</div>
                                </TableCell>
                                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="capitalize">{payment.method?.replace('_', ' ')}</span>
                                        <span className="text-xs text-muted-foreground">{payment.provider}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{payment.reference_code}</TableCell>
                                <TableCell>
                                    {payment.proof_url ? (
                                        <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${payment.proof_url}`} target="_blank" className="text-xs underline text-blue-600">View</a>
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
            </div>
        </div>
    )
}
