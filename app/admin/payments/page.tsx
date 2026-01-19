import { createClient } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { PaymentReviewActions } from "@/components/admin/payment-actions"

export default async function PaymentQueuePage() {
    const supabase = createClient()

    const { data: payments } = await supabase
        .from('payments')
        .select('*, users(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Payment Reconciliation</h1>
            <div className="rounded-md border bg-white">
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
                                <TableCell>MWK {payment.amount.toLocaleString()}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{payment.method}</span>
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
